-- Evaluate auth.jwt() once per statement for the admin RLS predicates.
-- This changes no permissions; it only applies Supabase's recommended RLS
-- init-plan form to the already-approved app_metadata role check.

alter policy "projects_admin_insert" on public.projects
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

alter policy "projects_admin_update" on public.projects
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

alter policy "projects_admin_delete" on public.projects
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

alter policy "inquiries_admin_all" on public.inquiries
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

alter policy "invoices_admin_all" on public.invoices
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
