-- Redefine can_user_read_project_budget to allow Team Members with the Cost toggle ON to view the budget

CREATE OR REPLACE FUNCTION public.can_user_read_project_budget(p_project_id uuid, p_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_org_id uuid;
  v_created_by uuid;
  v_role public.user_role;
  v_override boolean;
BEGIN
  SELECT organization_id, created_by 
  INTO v_org_id, v_created_by 
  FROM public.projects WHERE id = p_project_id;
  
  IF v_org_id IS NULL THEN RETURN false; END IF;
  IF v_created_by = p_user_id THEN RETURN true; END IF;
  IF public.is_workspace_owner(v_org_id, p_user_id) THEN RETURN true; END IF;
  
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  IF v_role IN ('Admin'::public.user_role, 'PM'::public.user_role) THEN
    RETURN true;
  END IF;

  SELECT can_edit_cost INTO v_override FROM public.project_members WHERE project_id = p_project_id AND user_id = p_user_id;
  RETURN COALESCE(v_override, false);
END;
$$;
