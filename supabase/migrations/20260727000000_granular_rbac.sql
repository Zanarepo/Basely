-- Migration: Granular RBAC
-- Version: 20260727000000_granular_rbac

-- 1. Add granular permission columns to project_members
ALTER TABLE public.project_members 
ADD COLUMN IF NOT EXISTS can_edit_schedule boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_cost boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_risks boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_documents boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS project_role_title text;

-- 2. Create specific permission check functions
CREATE OR REPLACE FUNCTION public.can_user_edit_schedule(p_project_id uuid, p_user_id uuid)
RETURNS boolean SECURITY DEFINER SET search_path = public LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_org_id uuid; v_created_by uuid; v_is_archived boolean; v_role public.user_role; v_override boolean;
BEGIN
  SELECT organization_id, created_by, is_archived INTO v_org_id, v_created_by, v_is_archived FROM public.projects WHERE id = p_project_id;
  IF v_org_id IS NULL OR v_is_archived THEN RETURN false; END IF;
  IF v_created_by = p_user_id OR public.is_workspace_owner(v_org_id, p_user_id) THEN RETURN true; END IF;
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  IF v_role IN ('Admin'::public.user_role, 'PM'::public.user_role) THEN RETURN true; END IF;
  
  SELECT can_edit_schedule INTO v_override FROM public.project_members WHERE project_id = p_project_id AND user_id = p_user_id;
  RETURN COALESCE(v_override, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_cost(p_project_id uuid, p_user_id uuid)
RETURNS boolean SECURITY DEFINER SET search_path = public LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_org_id uuid; v_created_by uuid; v_is_archived boolean; v_role public.user_role; v_override boolean;
BEGIN
  SELECT organization_id, created_by, is_archived INTO v_org_id, v_created_by, v_is_archived FROM public.projects WHERE id = p_project_id;
  IF v_org_id IS NULL OR v_is_archived THEN RETURN false; END IF;
  IF v_created_by = p_user_id OR public.is_workspace_owner(v_org_id, p_user_id) THEN RETURN true; END IF;
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  IF v_role IN ('Admin'::public.user_role, 'PM'::public.user_role) THEN RETURN true; END IF;
  
  SELECT can_edit_cost INTO v_override FROM public.project_members WHERE project_id = p_project_id AND user_id = p_user_id;
  RETURN COALESCE(v_override, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_risks(p_project_id uuid, p_user_id uuid)
RETURNS boolean SECURITY DEFINER SET search_path = public LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_org_id uuid; v_created_by uuid; v_is_archived boolean; v_role public.user_role; v_override boolean;
BEGIN
  SELECT organization_id, created_by, is_archived INTO v_org_id, v_created_by, v_is_archived FROM public.projects WHERE id = p_project_id;
  IF v_org_id IS NULL OR v_is_archived THEN RETURN false; END IF;
  IF v_created_by = p_user_id OR public.is_workspace_owner(v_org_id, p_user_id) THEN RETURN true; END IF;
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  IF v_role IN ('Admin'::public.user_role, 'PM'::public.user_role) THEN RETURN true; END IF;
  
  SELECT can_edit_risks INTO v_override FROM public.project_members WHERE project_id = p_project_id AND user_id = p_user_id;
  RETURN COALESCE(v_override, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_documents(p_project_id uuid, p_user_id uuid)
RETURNS boolean SECURITY DEFINER SET search_path = public LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_org_id uuid; v_created_by uuid; v_is_archived boolean; v_role public.user_role; v_override boolean;
BEGIN
  SELECT organization_id, created_by, is_archived INTO v_org_id, v_created_by, v_is_archived FROM public.projects WHERE id = p_project_id;
  IF v_org_id IS NULL OR v_is_archived THEN RETURN false; END IF;
  IF v_created_by = p_user_id OR public.is_workspace_owner(v_org_id, p_user_id) THEN RETURN true; END IF;
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  IF v_role IN ('Admin'::public.user_role, 'PM'::public.user_role) THEN RETURN true; END IF;
  
  SELECT can_edit_documents INTO v_override FROM public.project_members WHERE project_id = p_project_id AND user_id = p_user_id;
  RETURN COALESCE(v_override, false);
END;
$$;

-- 3. Replace WBS helper
CREATE OR REPLACE FUNCTION public.can_user_write_project_wbs(p_project_id uuid, p_user_id uuid)
RETURNS boolean SECURITY DEFINER SET search_path = public LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN public.can_user_edit_schedule(p_project_id, p_user_id);
END;
$$;

-- 4. Recreate Risk Policies
DROP POLICY IF EXISTS "Users can insert risks for projects in their organization" ON public.risks;
CREATE POLICY "Users can insert risks for projects in their organization" ON public.risks FOR INSERT WITH CHECK (public.can_user_edit_risks(project_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update risks for projects in their organization" ON public.risks;
CREATE POLICY "Users can update risks for projects in their organization" ON public.risks FOR UPDATE USING (public.can_user_edit_risks(project_id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete risks for projects in their organization" ON public.risks;
CREATE POLICY "Users can delete risks for projects in their organization" ON public.risks FOR DELETE USING (public.can_user_edit_risks(project_id, auth.uid()));

-- Recreate Issues Policies
DROP POLICY IF EXISTS "Users can insert issues for projects in their organization" ON public.issues;
CREATE POLICY "Users can insert issues for projects in their organization" ON public.issues FOR INSERT WITH CHECK (public.can_user_edit_risks(project_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update issues for projects in their organization" ON public.issues;
CREATE POLICY "Users can update issues for projects in their organization" ON public.issues FOR UPDATE USING (public.can_user_edit_risks(project_id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete issues for projects in their organization" ON public.issues;
CREATE POLICY "Users can delete issues for projects in their organization" ON public.issues FOR DELETE USING (public.can_user_edit_risks(project_id, auth.uid()));

-- 5. Recreate Cost Policies
DROP POLICY IF EXISTS "Insert cost_accounts" ON public.cost_accounts;
CREATE POLICY "Insert cost_accounts" ON public.cost_accounts FOR INSERT TO authenticated WITH CHECK (public.can_user_edit_cost((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid()));

DROP POLICY IF EXISTS "Update cost_accounts" ON public.cost_accounts;
CREATE POLICY "Update cost_accounts" ON public.cost_accounts FOR UPDATE TO authenticated USING (public.can_user_edit_cost((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())) WITH CHECK (public.can_user_edit_cost((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid()));

DROP POLICY IF EXISTS "Delete cost_accounts" ON public.cost_accounts;
CREATE POLICY "Delete cost_accounts" ON public.cost_accounts FOR DELETE TO authenticated USING (public.can_user_edit_cost((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid()));

DROP POLICY IF EXISTS "Insert time_phase_entries" ON public.time_phase_entries;
CREATE POLICY "Insert time_phase_entries" ON public.time_phase_entries FOR INSERT TO authenticated WITH CHECK (public.can_user_edit_cost((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid()));

DROP POLICY IF EXISTS "Update time_phase_entries" ON public.time_phase_entries;
CREATE POLICY "Update time_phase_entries" ON public.time_phase_entries FOR UPDATE TO authenticated USING (public.can_user_edit_cost((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid())) WITH CHECK (public.can_user_edit_cost((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid()));

DROP POLICY IF EXISTS "Delete time_phase_entries" ON public.time_phase_entries;
CREATE POLICY "Delete time_phase_entries" ON public.time_phase_entries FOR DELETE TO authenticated USING (public.can_user_edit_cost((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid()));

DROP POLICY IF EXISTS "Insert budget_baselines" ON public.budget_baselines;
CREATE POLICY "Insert budget_baselines" ON public.budget_baselines FOR INSERT TO authenticated WITH CHECK (public.can_user_edit_cost(project_id, auth.uid()));

DROP POLICY IF EXISTS "Update budget_baselines" ON public.budget_baselines;
CREATE POLICY "Update budget_baselines" ON public.budget_baselines FOR UPDATE TO authenticated USING (public.can_user_edit_cost(project_id, auth.uid())) WITH CHECK (public.can_user_edit_cost(project_id, auth.uid()));

DROP POLICY IF EXISTS "Delete budget_baselines" ON public.budget_baselines;
CREATE POLICY "Delete budget_baselines" ON public.budget_baselines FOR DELETE TO authenticated USING (public.can_user_edit_cost(project_id, auth.uid()));

DROP POLICY IF EXISTS "Insert baseline_cost_snapshots" ON public.baseline_cost_snapshots;
CREATE POLICY "Insert baseline_cost_snapshots" ON public.baseline_cost_snapshots FOR INSERT TO authenticated WITH CHECK (public.can_user_edit_cost((select project_id from public.budget_baselines where id = baseline_id), auth.uid()));

-- 6. Update Documents / Attachments Policies
-- (Currently we don't have a can_user_write_project_documents function in existing RLS, but we can update attachments directly)
DROP POLICY IF EXISTS "Users can create attachments" ON public.attachments;
CREATE POLICY "Users can create attachments" ON public.attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = attachments.project_id
            AND (
                public.is_workspace_owner(p.organization_id, auth.uid()) OR
                public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin', 'PM') OR
                p.created_by = auth.uid() OR
                public.can_user_edit_documents(p.id, auth.uid()) OR
                EXISTS (
                    SELECT 1 FROM public.project_members pm
                    WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                )
            )
        )
    );
