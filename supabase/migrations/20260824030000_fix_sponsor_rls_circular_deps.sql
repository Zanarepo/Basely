-- Migration: Fix circular dependencies and can_user_read_project for Sponsors
-- Version: 20260824030000_fix_sponsor_rls_circular_deps

-- 1. Break circular dependency in project_members RLS
drop policy if exists "Select project members" on public.project_members;
create policy "Select project members"
  on public.project_members for select
  using (true);

-- 2. Update can_user_read_project to support Sponsors
create or replace function public.can_user_read_project(p_project_id uuid, p_user_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_org_id uuid;
  v_created_by uuid;
  v_is_archived boolean;
  v_role public.user_role;
begin
  select organization_id, created_by, is_archived 
  into v_org_id, v_created_by, v_is_archived 
  from public.projects where id = p_project_id;
  
  if v_org_id is null then
    return false;
  end if;
  
  -- Creator
  if v_created_by = p_user_id then
    return true;
  end if;
  
  -- Workspace Owner
  if public.is_workspace_owner(v_org_id, p_user_id) then
    return true;
  end if;
  
  -- Role in Org
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  if v_role = 'Admin'::public.user_role then
    return true;
  end if;
  
  -- If not archived, check PM, Sponsor, or Project Member
  if not v_is_archived then
    if v_role = 'PM'::public.user_role then
      return true;
    end if;

    if v_role = 'Sponsor'::public.user_role then
      -- If they are in stakeholders
      if exists (select 1 from public.stakeholders where project_id = p_project_id and linked_user_id = p_user_id) then
        return true;
      end if;
    end if;

    if exists (select 1 from public.project_members where project_id = p_project_id and user_id = p_user_id) then
      return true;
    end if;
  end if;
  return false;
end;
$$;
