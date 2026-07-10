-- Migration: Enforce strict RLS — only creators or assigned members can see/edit/delete/archive
-- Version: 20260711180000_strict_project_select_rls
-- Updated: Viewer cannot edit. Admin can edit but not delete unless creator or granted rights.

-- Helper: check if a user has can_manage_all_members flag in an org (SECURITY DEFINER to bypass RLS)
create or replace function public.user_can_manage_all(p_org_id uuid, p_user_id uuid)
returns boolean
security definer
set search_path = public
language sql
stable
as $$
  select coalesce(
    (select can_manage_all_members from public.organization_members
     where organization_id = p_org_id and user_id = p_user_id and is_active = true),
    false
  );
$$;

-- 1. Drop existing policies
drop policy if exists "Select projects" on public.projects;
drop policy if exists "Update projects" on public.projects;
drop policy if exists "Delete projects" on public.projects;

-- 2. Strict SELECT: only creator or explicitly assigned member
create policy "Select projects"
  on public.projects for select
  using (
    (created_by = auth.uid())
    or public.is_project_member(id, auth.uid())
  );

-- 3. UPDATE: creator, workspace owner, admins, PMs, or assigned members with non-Viewer role
--    Viewers are never allowed to update.
create policy "Update projects"
  on public.projects for update
  using (
    -- Creator can always update
    (created_by = auth.uid())
    -- Workspace owner can update
    or public.is_workspace_owner(organization_id, auth.uid())
    -- Admin role can update (even if not assigned, as long as they can see it via SELECT)
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    -- Assigned project member with PM or Team Member role can update (NOT Viewer)
    or (
      not is_archived
      and public.is_project_member(id, auth.uid())
      and public.get_user_role_in_org(organization_id, auth.uid()) in ('PM'::public.user_role, 'Team Member'::public.user_role)
    )
  );

-- 4. DELETE: only creator, workspace owner, or admin with can_manage_all_members
create policy "Delete projects"
  on public.projects for delete
  using (
    -- Creator can always delete, regardless of role
    (created_by = auth.uid())
    -- Workspace owner can always delete
    or public.is_workspace_owner(organization_id, auth.uid())
    -- Admin with explicit can_manage_all_members grant
    or (
      public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
      and public.user_can_manage_all(organization_id, auth.uid())
    )
  );
