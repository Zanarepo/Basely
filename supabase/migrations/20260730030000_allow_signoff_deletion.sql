-- Migration: Enable single and bulk signoff card deletions and refine immutability trigger
-- Version: 20260730030000_allow_signoff_deletion

-- 1. Refine the structural immutability trigger to only block UPDATE operations on completed signatures,
-- while allowing explicit DELETE operations when authorized by Project Managers/Owners.
CREATE OR REPLACE FUNCTION public.enforce_signoff_immutability()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only forbid UPDATE modifications to completed signatures (tampering prevention).
  IF TG_OP = 'UPDATE' AND OLD.signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Immutable Compliance Error: A completed project closure sign-off record cannot be altered once executed.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Drop existing DELETE policy if present and create clean DELETE policy for project members/owners
DROP POLICY IF EXISTS "Delete signoffs" ON public.project_signoffs;

CREATE POLICY "Delete signoffs"
  ON public.project_signoffs FOR DELETE
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
  );
