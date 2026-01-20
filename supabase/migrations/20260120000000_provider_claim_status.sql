-- Adds claim/verification tracking to public.providers.
alter table public.providers add column if not exists claim_status text not null default 'unclaimed';
alter table public.providers add column if not exists verified_at timestamptz;
alter table public.providers add column if not exists claimed_by_user_id uuid null references auth.users(id);

update public.providers
set claim_status = 'claimed'
where claim_status = 'unclaimed'
  and (is_claimed = true or user_id is not null);

update public.providers
set claimed_by_user_id = user_id
where claimed_by_user_id is null
  and user_id is not null;

update public.providers
set verified_at = now()
where verified_at is null
  and user_id is not null;
