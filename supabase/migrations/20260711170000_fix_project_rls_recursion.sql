-- Migration: Fix circular RLS recursion between projects and project_members
-- Version: 20260711170000_fix_project_rls_recursion

-- 1. SECURITY DEFINER helpers to break circular RLS

-- Check if a user is a member of a specific project (bypasses project_members RLS)
create or replace function public.is_project_member(p_project_id uuid, p_user_id uuid)
returns boolean
security definer
set search_path = public
language sql
stable
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id
  );
$$;

-- Get the organization_id for a project (bypasses projects RLS)
create or replace function public.get_project_org_id(p_project_id uuid)
returns uuid
security definer
set search_path = public
language sql
stable
as $$
  select organization_id from public.projects where id = p_project_id;
$$;

-- Get the created_by for a project (bypasses projects RLS)
create or replace function public.get_project_creator(p_project_id uuid)
returns uuid
security definer
set search_path = public
language sql
stable
as $$
  select created_by from public.projects where id = p_project_id;
$$;

-- 2. Drop the recursive policies
drop policy if exists "Select projects" on public.projects;
drop policy if exists "Update projects" on public.projects;
drop policy if exists "Select project members" on public.project_members;
drop policy if exists "Manage project members" on public.project_members;

-- 3. Recreate projects SELECT policy using SECURITY DEFINER helper
create policy "Select projects"
  on public.projects for select
  using (
    public.is_workspace_owner(organization_id, auth.uid())
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    or (created_by = auth.uid())
    or (not is_archived and public.get_user_role_in_org(organization_id, auth.uid()) = 'PM'::public.user_role)
    or (not is_archived and public.is_project_member(id, auth.uid()))
  );

-- 4. Recreate projects UPDATE policy using SECURITY DEFINER helper
create policy "Update projects"
  on public.projects for update
  using (
    public.is_workspace_owner(organization_id, auth.uid())
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    or (created_by = auth.uid())
    or (not is_archived and public.get_user_role_in_org(organization_id, auth.uid()) = 'PM'::public.user_role)
    or (not is_archived and public.is_project_member(id, auth.uid()))
  );

-- 5. Recreate project_members SELECT policy using SECURITY DEFINER helpers
create policy "Select project members"
  on public.project_members for select
  using (
    user_id = auth.uid()
    or public.is_workspace_owner(public.get_project_org_id(project_id), auth.uid())
    or public.get_user_role_in_org(public.get_project_org_id(project_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
    or public.get_project_creator(project_id) = auth.uid()
  );

-- 6. Recreate project_members INSERT policy
create policy "Insert project members"
  on public.project_members for insert
  with check (
    public.is_workspace_owner(public.get_project_org_id(project_id), auth.uid())
    or public.get_user_role_in_org(public.get_project_org_id(project_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
    or public.get_project_creator(project_id) = auth.uid()
  );

-- 7. Recreate project_members DELETE policy
create policy "Delete project members"
  on public.project_members for delete
  using (
    public.is_workspace_owner(public.get_project_org_id(project_id), auth.uid())
    or public.get_user_role_in_org(public.get_project_org_id(project_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
    or public.get_project_creator(project_id) = auth.uid()
  );
