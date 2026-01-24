-- Lead events timeline
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_type text not null check (actor_type in ('system', 'admin', 'provider', 'public')),
  actor_user_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_events_lead_id_created_at_idx
  on public.lead_events (lead_id, created_at desc);

alter table public.lead_events enable row level security;

drop policy if exists "admin_all_lead_events" on public.lead_events;
create policy "admin_all_lead_events"
on public.lead_events
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "provider_read_lead_events" on public.lead_events;
create policy "provider_read_lead_events"
on public.lead_events
for select
using (
  exists (
    select 1
    from public.provider_users pu
    join public.leads l on l.provider_id = pu.provider_id
    where pu.user_id = auth.uid()
      and l.id = lead_events.lead_id
  )
);

drop policy if exists "provider_insert_lead_events" on public.lead_events;
create policy "provider_insert_lead_events"
on public.lead_events
for insert
with check (
  actor_type = 'provider'
  and exists (
    select 1
    from public.provider_users pu
    join public.leads l on l.provider_id = pu.provider_id
    where pu.user_id = auth.uid()
      and l.id = lead_events.lead_id
  )
);

create or replace function public.record_lead_event(
  p_lead_id uuid,
  p_actor_type text,
  p_event_type text,
  p_data jsonb default '{}'::jsonb,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_actor_user_id uuid := coalesce(p_actor_user_id, auth.uid());
begin
  if p_actor_type not in ('system', 'admin', 'provider', 'public') then
    raise exception 'Invalid actor type';
  end if;

  if auth.uid() is null then
    if p_actor_type not in ('system', 'public') then
      raise exception 'Not authorized';
    end if;
  else
    if public.is_admin() then
      -- admin can record any event
      null;
    else
      if p_actor_type <> 'provider' then
        raise exception 'Not authorized';
      end if;
      if not exists (
        select 1
        from public.provider_users pu
        join public.leads l on l.provider_id = pu.provider_id
        where pu.user_id = auth.uid()
          and l.id = p_lead_id
      ) then
        raise exception 'Not authorized';
      end if;
    end if;
  end if;

  insert into public.lead_events (lead_id, actor_type, actor_user_id, event_type, data)
  values (p_lead_id, p_actor_type, v_actor_user_id, p_event_type, coalesce(p_data, '{}'::jsonb))
  returning id into v_event_id;

  return v_event_id;
end;
$$;

grant execute on function public.record_lead_event(uuid, text, text, jsonb, uuid) to anon, authenticated;

-- Lead decline fields + delivery status semantics
alter table public.leads add column if not exists declined_at timestamptz;
alter table public.leads add column if not exists decline_reason text;
alter table public.leads add column if not exists declined_by_provider_id uuid references public.providers(id);

alter table public.leads drop constraint if exists leads_delivery_status_check;
alter table public.leads add constraint leads_delivery_status_check
  check (delivery_status in ('pending', 'delivered', 'failed', 'skipped'));

-- Lead submit attempt tracking (rate limiting)
create table if not exists public.lead_submit_attempts (
  ip_hash text not null,
  attempt_date date not null,
  attempt_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ip_hash, attempt_date)
);

alter table public.lead_submit_attempts enable row level security;

create or replace function public.record_lead_submit_attempt(
  p_ip_hash text,
  p_attempt_date date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.lead_submit_attempts (ip_hash, attempt_date, attempt_count)
  values (p_ip_hash, p_attempt_date, 1)
  on conflict (ip_hash, attempt_date)
  do update set attempt_count = lead_submit_attempts.attempt_count + 1,
                updated_at = now()
  returning attempt_count into v_count;

  return v_count;
end;
$$;

grant execute on function public.record_lead_submit_attempt(text, date) to anon, authenticated;

-- Provider media
alter table public.providers add column if not exists logo_path text;

create table if not exists public.provider_photos (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);

create index if not exists provider_photos_provider_id_idx
  on public.provider_photos (provider_id);

alter table public.provider_photos enable row level security;

drop policy if exists "public_read_provider_photos" on public.provider_photos;
create policy "public_read_provider_photos"
on public.provider_photos
for select
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_photos.provider_id
      and p.is_published = true
      and p.status = 'active'
  )
);

drop policy if exists "provider_manage_provider_photos" on public.provider_photos;
create policy "provider_manage_provider_photos"
on public.provider_photos
for all
using (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = provider_photos.provider_id
      and pu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = provider_photos.provider_id
      and pu.user_id = auth.uid()
  )
);

drop policy if exists "admin_all_provider_photos" on public.provider_photos;
create policy "admin_all_provider_photos"
on public.provider_photos
for all
using (public.is_admin())
with check (public.is_admin());

-- Storage buckets and policies
insert into storage.buckets (id, name, public)
values ('provider-logos', 'provider-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('provider-photos', 'provider-photos', true)
on conflict (id) do nothing;

drop policy if exists "public_read_provider_logos" on storage.objects;
create policy "public_read_provider_logos"
on storage.objects
for select
using (
  bucket_id = 'provider-logos'
  and exists (
    select 1
    from public.providers p
    where p.id = split_part(storage.objects.name, '/', 1)::uuid
      and p.is_published = true
      and p.status = 'active'
  )
);

drop policy if exists "public_read_provider_photos" on storage.objects;
create policy "public_read_provider_photos"
on storage.objects
for select
using (
  bucket_id = 'provider-photos'
  and exists (
    select 1
    from public.providers p
    where p.id = split_part(storage.objects.name, '/', 1)::uuid
      and p.is_published = true
      and p.status = 'active'
  )
);

drop policy if exists "provider_insert_provider_logos" on storage.objects;
create policy "provider_insert_provider_logos"
on storage.objects
for insert
with check (
  bucket_id = 'provider-logos'
  and exists (
    select 1
    from public.provider_users pu
    where pu.user_id = auth.uid()
      and pu.provider_id = split_part(storage.objects.name, '/', 1)::uuid
  )
);

drop policy if exists "provider_delete_provider_logos" on storage.objects;
create policy "provider_delete_provider_logos"
on storage.objects
for delete
using (
  bucket_id = 'provider-logos'
  and exists (
    select 1
    from public.provider_users pu
    where pu.user_id = auth.uid()
      and pu.provider_id = split_part(storage.objects.name, '/', 1)::uuid
  )
);

drop policy if exists "provider_insert_provider_photos" on storage.objects;
create policy "provider_insert_provider_photos"
on storage.objects
for insert
with check (
  bucket_id = 'provider-photos'
  and exists (
    select 1
    from public.provider_users pu
    where pu.user_id = auth.uid()
      and pu.provider_id = split_part(storage.objects.name, '/', 1)::uuid
  )
);

drop policy if exists "provider_delete_provider_photos" on storage.objects;
create policy "provider_delete_provider_photos"
on storage.objects
for delete
using (
  bucket_id = 'provider-photos'
  and exists (
    select 1
    from public.provider_users pu
    where pu.user_id = auth.uid()
      and pu.provider_id = split_part(storage.objects.name, '/', 1)::uuid
  )
);

drop policy if exists "admin_all_storage_objects" on storage.objects;
create policy "admin_all_storage_objects"
on storage.objects
for all
using (public.is_admin())
with check (public.is_admin());

-- Metro rotation metadata
alter table public.metro_lead_rotation add column if not exists last_assigned_at timestamptz;
