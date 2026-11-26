-- Supabase security hardening
--
-- This migration preserves the public project read path, restricts inquiry
-- writes to the intended public insert surface, removes public invoice access,
-- and authorizes dashboard mutations through server-managed app_metadata.
-- No table columns or data rows are changed.

do $$
declare
  target_user_id uuid;
  existing_app_role text;
begin
  -- Assign admin role to your initial dashboard admin account (update email before running).
  select
    id,
    coalesce(raw_app_meta_data->>'role', '')
  into target_user_id, existing_app_role
  from auth.users
  where lower(email) = 'admin@example.com'
  order by last_sign_in_at desc nulls last
  limit 1;

  if target_user_id is null then
    raise exception 'Expected existing admin account was not found';
  end if;

  if existing_app_role not in ('', 'admin') then
    raise exception 'Refusing to overwrite existing app_metadata role: %', existing_app_role;
  end if;

  update auth.users
  set raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb,
    true
  )
  where id = target_user_id;
end $$;

-- Remove the existing broad and duplicate policies before creating the
-- least-privilege policy set.
drop policy if exists "Allow Public Delete Projects" on public.projects;
drop policy if exists "Allow Public Insert Projects" on public.projects;
drop policy if exists "Allow Public Read Projects" on public.projects;
drop policy if exists "Allow Public Update Projects" on public.projects;
drop policy if exists "Enable delete access for all users" on public.projects;
drop policy if exists "Enable insert access for all users" on public.projects;
drop policy if exists "Enable read access for all users" on public.projects;
drop policy if exists "Enable update access for all users" on public.projects;
drop policy if exists "Only authenticated users can delete" on public.projects;
drop policy if exists "Only authenticated users can insert" on public.projects;
drop policy if exists "Only authenticated users can update" on public.projects;
drop policy if exists "Public can read projects" on public.projects;

drop policy if exists "Allow authenticated admin full access" on public.inquiries;
drop policy if exists "Allow public form submissions" on public.inquiries;

drop policy if exists "Allow full access to invoices" on public.invoices;

alter table public.projects enable row level security;
alter table public.inquiries enable row level security;
alter table public.invoices enable row level security;

-- Keep the Data API grants no broader than the intended operation set. RLS
-- remains the authorization boundary for authenticated admin operations.
revoke all on table public.projects from anon;
revoke all on table public.projects from authenticated;
revoke all on table public.inquiries from anon;
revoke all on table public.inquiries from authenticated;
revoke all on table public.invoices from anon;
revoke all on table public.invoices from authenticated;

grant select on table public.projects to anon;
grant select, insert, update, delete on table public.projects to authenticated;

grant insert on table public.inquiries to anon;
grant select, insert, update, delete on table public.inquiries to authenticated;

grant select, insert, update, delete on table public.invoices to authenticated;

-- Public project listing/detail pages remain available to anonymous and
-- authenticated visitors. No public write policy exists.
create policy "projects_public_select"
on public.projects
for select
to anon, authenticated
using (true);

create policy "projects_admin_insert"
on public.projects
for insert
to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "projects_admin_update"
on public.projects
for update
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "projects_admin_delete"
on public.projects
for delete
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Anonymous website submissions can create only initial unread records.
-- The existing database default remains the source of the default value.
create policy "inquiries_public_insert"
on public.inquiries
for insert
to anon
with check (status = 'unread');

create policy "inquiries_admin_all"
on public.inquiries
for all
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Invoices contain financial and client-identifying information. They have no
-- anonymous policy; all four dashboard operations require the admin claim.
create policy "invoices_admin_all"
on public.invoices
for all
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
