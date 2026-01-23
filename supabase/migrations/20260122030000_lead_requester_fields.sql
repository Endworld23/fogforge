-- Adds requester detail fields to public.leads for quote requests.
alter table public.leads add column if not exists requester_first_name text;
alter table public.leads add column if not exists requester_last_name text;
alter table public.leads add column if not exists requester_business_name text;
alter table public.leads add column if not exists requester_address text;
