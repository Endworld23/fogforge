create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.metros (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  state text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  business_name text not null,
  phone text null,
  website_url text null,
  email_public text null,
  description text null,
  street text null,
  city text not null,
  state text not null,
  postal_code text null,
  metro_id uuid not null references public.metros(id),
  category_id uuid not null references public.categories(id),
  is_published boolean not null default true,
  status text not null default 'active' check (status in ('active', 'suspended')),
  is_claimed boolean not null default false,
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  monthly_price_cents integer not null,
  weight integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id),
  plan_id uuid not null references public.plans(id),
  stripe_customer_id text null,
  stripe_subscription_id text null,
  status text not null default 'inactive' check (status in ('inactive', 'active', 'past_due', 'canceled')),
  current_period_start timestamptz null,
  current_period_end timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid null references public.providers(id),
  category_id uuid not null references public.categories(id),
  metro_id uuid not null references public.metros(id),
  name text not null,
  email text not null,
  phone text null,
  message text null,
  source_url text null,
  status text not null default 'new' check (status in ('new', 'sent', 'failed', 'spam')),
  created_at timestamptz not null default now()
);

create table if not exists public.lead_deliveries (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id),
  provider_id uuid not null references public.providers(id),
  method text not null check (method in ('email', 'sms')),
  status text not null check (status in ('sent', 'failed')),
  error text null,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_offers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text null,
  affiliate_url text not null,
  disclosure_text text null,
  placement text not null check (placement in ('guide', 'sidebar', 'footer', 'provider_dashboard')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null check (severity in ('info', 'warn', 'critical')),
  payload jsonb not null default '{}'::jsonb,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists providers_metro_category_published_idx
  on public.providers (metro_id, category_id, is_published);
create index if not exists providers_slug_idx on public.providers (slug);
create index if not exists providers_status_idx on public.providers (status);

create index if not exists leads_metro_category_created_at_idx
  on public.leads (metro_id, category_id, created_at desc);
create index if not exists leads_provider_id_idx on public.leads (provider_id);

create index if not exists subscriptions_provider_id_idx on public.subscriptions (provider_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

create index if not exists metros_slug_idx on public.metros (slug);
create index if not exists categories_slug_idx on public.categories (slug);

alter table public.categories enable row level security;
alter table public.metros enable row level security;
alter table public.providers enable row level security;
alter table public.admins enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.leads enable row level security;
alter table public.lead_deliveries enable row level security;
alter table public.affiliate_offers enable row level security;
alter table public.alerts enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where user_id = auth.uid()
  );
$$;

create policy "public_read_categories"
on public.categories
for select
using (true);

create policy "admin_all_categories"
on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

create policy "public_read_metros"
on public.metros
for select
using (true);

create policy "admin_all_metros"
on public.metros
for all
using (public.is_admin())
with check (public.is_admin());

create policy "public_read_providers"
on public.providers
for select
using (is_published = true and status = 'active');

create policy "provider_self_update"
on public.providers
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "admin_all_providers"
on public.providers
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin_manage_admins"
on public.admins
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin_all_plans"
on public.plans
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin_all_subscriptions"
on public.subscriptions
for all
using (public.is_admin())
with check (public.is_admin());

create policy "public_insert_leads"
on public.leads
for insert
with check (true);

create policy "provider_read_leads"
on public.leads
for select
using (
  exists (
    select 1
    from public.providers p
    where p.id = leads.provider_id
      and p.user_id = auth.uid()
  )
);

create policy "admin_read_leads"
on public.leads
for select
using (public.is_admin());

create policy "admin_all_lead_deliveries"
on public.lead_deliveries
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin_all_affiliate_offers"
on public.affiliate_offers
for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin_all_alerts"
on public.alerts
for all
using (public.is_admin())
with check (public.is_admin());
