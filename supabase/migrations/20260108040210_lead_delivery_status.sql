-- Adds delivery tracking fields to public.leads.
alter table public.leads add column if not exists delivery_status text default 'pending';
alter table public.leads add column if not exists delivered_at timestamptz;
alter table public.leads add column if not exists delivery_error text;
