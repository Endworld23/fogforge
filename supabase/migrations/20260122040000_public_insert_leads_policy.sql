-- Enables public lead inserts with minimal validation.
alter table public.leads enable row level security;

drop policy if exists "public_insert_leads" on public.leads;

create policy "public_insert_leads"
on public.leads
for insert
to anon, authenticated
with check (
  char_length(trim(coalesce(name, ''))) > 0
  and char_length(trim(coalesce(email, ''))) > 0
  and char_length(trim(coalesce(phone, ''))) > 0
  and metro_id is not null
);

create policy "admin_insert_leads"
on public.leads
for insert
to authenticated
with check (public.is_admin());
