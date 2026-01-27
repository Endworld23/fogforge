-- Provider logo URL + media gallery (V1).
alter table public.providers add column if not exists logo_url text;

create table if not exists public.provider_media (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists provider_media_provider_id_idx
  on public.provider_media (provider_id);

alter table public.provider_media enable row level security;

drop policy if exists "public_read_provider_media" on public.provider_media;
create policy "public_read_provider_media"
on public.provider_media
for select
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_media.provider_id
      and p.is_published = true
      and p.status = 'active'
  )
);

drop policy if exists "provider_manage_provider_media" on public.provider_media;
create policy "provider_manage_provider_media"
on public.provider_media
for all
using (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = provider_media.provider_id
      and pu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = provider_media.provider_id
      and pu.user_id = auth.uid()
  )
);

drop policy if exists "admin_all_provider_media" on public.provider_media;
create policy "admin_all_provider_media"
on public.provider_media
for all
using (public.is_admin())
with check (public.is_admin());
