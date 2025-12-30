insert into public.categories (slug, name)
values ('grease-trap-cleaning', 'Grease Trap Cleaning')
on conflict (slug) do update
set name = excluded.name;

insert into public.metros (slug, name, state)
values
  ('houston-tx', 'Houston', 'TX'),
  ('dallas-fort-worth-tx', 'Dallas–Fort Worth', 'TX'),
  ('san-antonio-tx', 'San Antonio', 'TX'),
  ('austin-tx', 'Austin', 'TX'),
  ('corpus-christi-tx', 'Corpus Christi', 'TX'),
  ('mcallen-tx', 'McAllen–Edinburg–Mission', 'TX'),
  ('el-paso-tx', 'El Paso', 'TX'),
  ('phoenix-az', 'Phoenix–Mesa–Chandler', 'AZ'),
  ('tucson-az', 'Tucson', 'AZ')
on conflict (slug) do update
set name = excluded.name,
    state = excluded.state;

insert into public.plans (code, name, monthly_price_cents, weight, is_active)
values
  ('FREE', 'Free', 0, 0, true),
  ('STANDARD', 'Standard', 5900, 5, true),
  ('FEATURED', 'Featured', 12900, 10, true),
  ('SPONSORED', 'Sponsored', 39900, 15, true)
on conflict (code) do update
set name = excluded.name,
    monthly_price_cents = excluded.monthly_price_cents,
    weight = excluded.weight,
    is_active = excluded.is_active;
