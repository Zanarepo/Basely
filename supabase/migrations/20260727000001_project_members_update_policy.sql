-- Migration: Add UPDATE policy for project_members
-- Version: 20260727000001_project_members_update_policy

-- Drop if exists just in case
drop policy if exists "Update project members" on public.project_members;

-- Recreate project_members UPDATE policy using SECURITY DEFINER helpers
create policy "Update project members"
  on public.project_members for update
  using (
    public.is_workspace_owner(public.get_project_org_id(project_id), auth.uid())
    or public.get_user_role_in_org(public.get_project_org_id(project_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
    or public.get_project_creator(project_id) = auth.uid()
  )
  with check (
    public.is_workspace_owner(public.get_project_org_id(project_id), auth.uid())
    or public.get_user_role_in_org(public.get_project_org_id(project_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
    or public.get_project_creator(project_id) = auth.uid()
  );
