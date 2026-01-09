create table if not exists public.business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (business_id),
  unique (user_id)
);

create table if not exists public.onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('claim', 'list')),
  business_id uuid null references public.providers(id) on delete cascade,
  metro_id uuid null references public.metros(id),
  business_name text null,
  city text null,
  state text null,
  email text not null,
  full_name text null,
  phone text null,
  role_title text null,
  notes text null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id),
  rejection_reason text null
);

create table if not exists public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  onboarding_request_id uuid not null references public.onboarding_requests(id) on delete cascade,
  storage_path text not null,
  file_name text null,
  mime_type text null,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_requests_status_idx
  on public.onboarding_requests (status);

create index if not exists onboarding_requests_user_id_idx
  on public.onboarding_requests (user_id);

create index if not exists onboarding_requests_business_id_idx
  on public.onboarding_requests (business_id);

create unique index if not exists onboarding_requests_pending_business_idx
  on public.onboarding_requests (business_id)
  where type = 'claim' and status = 'pending';

create unique index if not exists onboarding_requests_pending_user_idx
  on public.onboarding_requests (user_id)
  where status = 'pending';

alter table public.business_claims enable row level security;
alter table public.onboarding_requests enable row level security;
alter table public.onboarding_documents enable row level security;

create policy "business_claims_select_auth"
on public.business_claims
for select
to authenticated
using (true);

create policy "business_claims_admin_insert"
on public.business_claims
for insert
to authenticated
with check (public.is_admin());

create policy "onboarding_requests_insert_own"
on public.onboarding_requests
for insert
to authenticated
with check (user_id = auth.uid());

create policy "onboarding_requests_select_own"
on public.onboarding_requests
for select
to authenticated
using (user_id = auth.uid());

create policy "onboarding_requests_admin_all"
on public.onboarding_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "onboarding_documents_insert_own"
on public.onboarding_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.onboarding_requests r
    where r.id = onboarding_request_id
      and r.user_id = auth.uid()
  )
);

create policy "onboarding_documents_select_own"
on public.onboarding_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.onboarding_requests r
    where r.id = onboarding_request_id
      and r.user_id = auth.uid()
  )
  or public.is_admin()
);

insert into storage.buckets (id, name, public)
values ('onboarding-docs', 'onboarding-docs', false)
on conflict (id) do nothing;

create policy "onboarding_docs_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'onboarding-docs'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "onboarding_docs_select_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'onboarding-docs'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_admin()
  )
);