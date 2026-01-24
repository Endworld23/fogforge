create table if not exists public.metro_lead_rotation (
  metro_id uuid primary key references public.metros (id) on delete cascade,
  last_provider_id uuid references public.providers (id),
  updated_at timestamptz not null default now()
);

create index if not exists metro_lead_rotation_last_provider_id_idx
  on public.metro_lead_rotation (last_provider_id);
