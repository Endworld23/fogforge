-- Adds lifecycle fields to public.leads (V1).
alter table public.leads add column if not exists viewed_at timestamptz;
alter table public.leads add column if not exists last_contacted_at timestamptz;
alter table public.leads add column if not exists resolved_at timestamptz;
alter table public.leads add column if not exists resolution_status text;
alter table public.leads add column if not exists escalated_at timestamptz;
alter table public.leads add column if not exists escalation_reason text;
alter table public.leads add column if not exists follow_up_at timestamptz;
alter table public.leads add column if not exists next_action text;
