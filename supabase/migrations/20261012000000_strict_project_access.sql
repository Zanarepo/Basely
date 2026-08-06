-- Migration: Enforce project-level access control
-- Members can only see projects they are explicitly assigned to.
-- Owner and Admin retain global visibility across all org projects.

-- 1. Drop existing project SELECT policy
drop policy if exists "Select projects" on public.projects;

-- 2. Recreate strict project SELECT policy
-- Owner & Admin: see all projects in their org
-- Everyone else: only see projects where they are in project_members
create policy "Select projects"
  on public.projects for select
  using (
    -- Workspace owner always sees all projects
    public.is_workspace_owner(organization_id, auth.uid())
    -- Admin role always sees all projects
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    -- Creator always sees their own project
    or (created_by = auth.uid())
    -- All other roles: must be explicitly assigned as a project member
    or (not is_archived and public.is_project_member(id, auth.uid()))
  );
