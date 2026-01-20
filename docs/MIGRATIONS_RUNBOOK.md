# Migrations Runbook

Keep this list short and actionable. Apply each migration in Supabase Dashboard - SQL Editor and verify after running.

## supabase/migrations/20260108040210_lead_delivery_status.sql
- Changes: adds lead delivery tracking fields (`delivery_status`, `delivered_at`, `delivery_error`) to `public.leads`.
- Apply: paste the file contents into Supabase Dashboard - SQL Editor and run.
- Verify:

```sql
select
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'leads'
  and column_name in ('delivery_status', 'delivered_at', 'delivery_error');
```

## supabase/migrations/20260120000000_provider_claim_status.sql
- Changes: adds provider claim/verification fields (`claim_status`, `verified_at`, `claimed_by_user_id`) to `public.providers` and backfills from existing claim data.
- Apply: paste the file contents into Supabase Dashboard - SQL Editor and run.
- Verify:

```sql
select
  column_name,
  data_type,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'providers'
  and column_name in ('claim_status', 'verified_at', 'claimed_by_user_id');
```
