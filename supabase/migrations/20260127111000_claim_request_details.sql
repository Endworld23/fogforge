-- Claim request identity fields + documents (V1).
alter table public.provider_claim_requests add column if not exists claimant_first_name text;
alter table public.provider_claim_requests add column if not exists claimant_last_name text;
alter table public.provider_claim_requests add column if not exists claimant_phone text;
alter table public.provider_claim_requests add column if not exists claimant_role text;
alter table public.provider_claim_requests add column if not exists claimant_role_other text;
alter table public.provider_claim_requests add column if not exists claimant_address_line1 text;
alter table public.provider_claim_requests add column if not exists claimant_address_line2 text;
alter table public.provider_claim_requests add column if not exists claimant_city text;
alter table public.provider_claim_requests add column if not exists claimant_state text;
alter table public.provider_claim_requests add column if not exists claimant_zip text;

create table if not exists public.provider_claim_request_documents (
  id uuid primary key default gen_random_uuid(),
  claim_request_id uuid not null references public.provider_claim_requests(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists provider_claim_request_documents_request_id_idx
  on public.provider_claim_request_documents (claim_request_id);

alter table public.provider_claim_request_documents enable row level security;

drop policy if exists "requester_insert_claim_request_documents" on public.provider_claim_request_documents;
create policy "requester_insert_claim_request_documents"
on public.provider_claim_request_documents
for insert
with check (
  exists (
    select 1
    from public.provider_claim_requests r
    where r.id = provider_claim_request_documents.claim_request_id
      and r.requester_user_id = auth.uid()
  )
);

drop policy if exists "requester_read_claim_request_documents" on public.provider_claim_request_documents;
create policy "requester_read_claim_request_documents"
on public.provider_claim_request_documents
for select
using (
  exists (
    select 1
    from public.provider_claim_requests r
    where r.id = provider_claim_request_documents.claim_request_id
      and r.requester_user_id = auth.uid()
  )
);

drop policy if exists "admin_all_claim_request_documents" on public.provider_claim_request_documents;
create policy "admin_all_claim_request_documents"
on public.provider_claim_request_documents
for all
using (public.is_admin())
with check (public.is_admin());

-- Storage bucket + policies for claim documents.
insert into storage.buckets (id, name, public)
values ('claim-documents', 'claim-documents', false)
on conflict (id) do nothing;

drop policy if exists "requester_insert_claim_documents" on storage.objects;
create policy "requester_insert_claim_documents"
on storage.objects
for insert
with check (
  bucket_id = 'claim-documents'
  and auth.uid() is not null
);

drop policy if exists "requester_read_claim_documents" on storage.objects;
create policy "requester_read_claim_documents"
on storage.objects
for select
using (
  bucket_id = 'claim-documents'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.provider_claim_requests r
      where r.id = split_part(storage.objects.name, '/', 1)::uuid
        and r.requester_user_id = auth.uid()
    )
  )
);

drop policy if exists "admin_delete_claim_documents" on storage.objects;
create policy "admin_delete_claim_documents"
on storage.objects
for delete
using (
  bucket_id = 'claim-documents'
  and public.is_admin()
);
