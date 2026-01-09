-- Adds address fields to onboarding requests for future billing/verification needs.
alter table public.onboarding_requests add column if not exists street text;
alter table public.onboarding_requests add column if not exists postal_code text;
