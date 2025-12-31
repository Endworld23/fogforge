create table if not exists public.provider_users (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, provider_id),
  unique (user_id)
);

create index if not exists provider_users_provider_id_idx
  on public.provider_users (provider_id);

alter table public.provider_users enable row level security;

create policy "provider_users_select_own"
on public.provider_users
for select
using (user_id = auth.uid());

create policy "admin_all_provider_users"
on public.provider_users
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "provider_self_update" on public.providers;

create policy "provider_user_read_providers"
on public.providers
for select
using (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = providers.id
      and pu.user_id = auth.uid()
  )
);

create policy "provider_user_update_providers"
on public.providers
for update
using (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = providers.id
      and pu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = providers.id
      and pu.user_id = auth.uid()
  )
);

drop policy if exists "provider_read_leads" on public.leads;

create policy "provider_user_read_leads"
on public.leads
for select
using (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = leads.provider_id
      and pu.user_id = auth.uid()
  )
);

create policy "provider_read_lead_deliveries"
on public.lead_deliveries
for select
using (
  exists (
    select 1
    from public.provider_users pu
    where pu.provider_id = lead_deliveries.provider_id
      and pu.user_id = auth.uid()
  )
);
