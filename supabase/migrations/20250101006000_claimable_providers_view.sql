create or replace view public.claimable_providers as
select p.id, p.business_name, p.city, p.state
from public.providers p
where not exists (
  select 1
  from public.business_claims bc
  where bc.business_id = p.id
)
and not exists (
  select 1
  from public.onboarding_requests r
  where r.business_id = p.id
    and r.type = 'claim'
    and r.status = 'pending'
);

create or replace function public.enforce_claim_request()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'claim' and new.status = 'pending' and new.business_id is not null then
    if exists (
      select 1
      from public.business_claims bc
      where bc.business_id = new.business_id
    ) then
      raise exception 'Business already claimed';
    end if;

    if exists (
      select 1
      from public.onboarding_requests r
      where r.business_id = new.business_id
        and r.type = 'claim'
        and r.status = 'pending'
        and r.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000')
    ) then
      raise exception 'Pending claim already exists';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_claim_request_insert on public.onboarding_requests;
create trigger enforce_claim_request_insert
before insert on public.onboarding_requests
for each row
execute function public.enforce_claim_request();

drop trigger if exists enforce_claim_request_update on public.onboarding_requests;
create trigger enforce_claim_request_update
before update of business_id, status, type on public.onboarding_requests
for each row
execute function public.enforce_claim_request();
