insert into public.metros (slug, name, state)
values ('las-vegas-nv', 'Las Vegas', 'NV')
on conflict (slug) do update
set name = excluded.name,
    state = excluded.state;
