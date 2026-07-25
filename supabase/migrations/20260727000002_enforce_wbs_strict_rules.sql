-- Migration: Enforce strict WBS rules (UVP)
-- Version: 20260727000002_enforce_wbs_strict_rules

-- The user's Unique Value Proposition: 
-- "any team member that wasnt assigned a task cant edit or move it, it can only be moved either by an admin or a PM."
-- This reverts can_user_write_project_wbs to NOT use the granular `can_edit_schedule` toggle,
-- ensuring that only global Admins, PMs, or the specifically assigned RACI members (via the other policy) can modify the WBS.

CREATE OR REPLACE FUNCTION public.can_user_write_project_wbs(p_project_id uuid, p_user_id uuid)
RETURNS boolean SECURITY DEFINER SET search_path = public LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_org_id uuid;
  v_created_by uuid;
  v_is_archived boolean;
  v_role public.user_role;
BEGIN
  SELECT organization_id, created_by, is_archived 
  INTO v_org_id, v_created_by, v_is_archived 
  FROM public.projects WHERE id = p_project_id;
  
  IF v_org_id IS NULL THEN RETURN false; END IF;
  IF v_is_archived THEN RETURN false; END IF;
  IF v_created_by = p_user_id THEN RETURN true; END IF;
  IF public.is_workspace_owner(v_org_id, p_user_id) THEN RETURN true; END IF;
  
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  IF v_role IN ('Admin'::public.user_role, 'PM'::public.user_role) THEN 
    RETURN true; 
  END IF;
  
  RETURN false;
END;
$$;
