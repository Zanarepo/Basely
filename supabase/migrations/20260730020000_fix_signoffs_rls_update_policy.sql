-- Migration: Fix implicit WITH CHECK violation on project_signoffs UPDATE policy
-- Version: 20260730020000_fix_signoffs_rls_update_policy

-- Drop the problematic UPDATE policy that fails when signed_at is changed from NULL to NOT NULL
DROP POLICY IF EXISTS "Update unsigned signoffs" ON public.project_signoffs;

-- Create clean UPDATE policy with explicit USING and WITH CHECK expressions
CREATE POLICY "Update unsigned signoffs"
  ON public.project_signoffs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_signoffs.project_id
        AND (
          public.is_workspace_owner(p.organization_id, auth.uid())
          OR p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_members m
            WHERE m.project_id = p.id AND m.user_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.is_workspace_owner(p.organization_id, auth.uid())
          OR p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.project_members m
            WHERE m.project_id = p.id AND m.user_id = auth.uid()
          )
        )
    )
  );

-- Note: Structural immutability against altering already-signed records remains 
-- strictly and permanently enforced by the trigger enforce_signoff_immutability().
