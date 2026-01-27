-- Provider claim requests (V1).
create table if not exists public.provider_claim_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  requester_email text null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  message text null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users(id) on delete set null
);

create index if not exists provider_claim_requests_provider_id_idx
  on public.provider_claim_requests (provider_id);
create index if not exists provider_claim_requests_requester_id_idx
  on public.provider_claim_requests (requester_user_id);
create index if not exists provider_claim_requests_status_idx
  on public.provider_claim_requests (status);

alter table public.provider_claim_requests enable row level security;

drop policy if exists "requester_insert_claim_request" on public.provider_claim_requests;
create policy "requester_insert_claim_request"
on public.provider_claim_requests
for insert
with check (
  requester_user_id = auth.uid()
  and status = 'PENDING'
);

drop policy if exists "requester_read_claim_requests" on public.provider_claim_requests;
create policy "requester_read_claim_requests"
on public.provider_claim_requests
for select
using (requester_user_id = auth.uid());

drop policy if exists "admin_all_claim_requests" on public.provider_claim_requests;
create policy "admin_all_claim_requests"
on public.provider_claim_requests
for all
using (public.is_admin())
with check (public.is_admin());
