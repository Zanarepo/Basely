-- Migration: Update projects RLS policy for Sponsor
-- Version: 20260824050001_sponsor_rls_projects

drop policy if exists "Select projects" on public.projects;

create policy "Select projects"
  on public.projects for select
  using (
    -- Workspace Owner
    public.is_workspace_owner(organization_id, auth.uid())
    -- Admin role
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    -- Creator (always sees own project, even if archived)
    or (created_by = auth.uid())
    -- Active project + PM or Sponsor role
    or (not is_archived and public.get_user_role_in_org(organization_id, auth.uid()) in ('PM'::public.user_role, 'Sponsor'::public.user_role))
    -- Active project + Project Member
    or (
      not is_archived 
      and exists (
        select 1 from public.project_members
        where project_id = id and user_id = auth.uid()
      )
    )
  );
