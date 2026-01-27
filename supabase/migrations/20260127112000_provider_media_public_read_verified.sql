-- Restrict public provider_media reads to verified providers.

drop policy if exists "public_read_provider_media" on public.provider_media;
create policy "public_read_provider_media"
on public.provider_media
for select
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_media.provider_id
      and p.is_published = true
      and p.status = 'active'
      and p.verified_at is not null
  )
);
