create policy "admins_self_select"
on public.admins
for select
using (user_id = auth.uid());

create policy "admins_admin_select"
on public.admins
for select
using (public.is_admin());
