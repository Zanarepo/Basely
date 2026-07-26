-- Migration: Project Closure Sign-off Records & Immutable External Tokens
-- Version: 20260730010000_project_signoffs

-- 1. Create project_signoffs table to store internal and external closure acceptances
CREATE TABLE IF NOT EXISTS public.project_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  signer_type TEXT NOT NULL CHECK (signer_type IN ('internal_user', 'external_stakeholder')),
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_reference TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create indices for token lookups and project query speed
CREATE INDEX IF NOT EXISTS idx_project_signoffs_project_id ON public.project_signoffs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_signoffs_token ON public.project_signoffs(token) WHERE token IS NOT NULL;

-- 3. Enable Row Level Security
ALTER TABLE public.project_signoffs ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if re-running
DROP POLICY IF EXISTS "Select signoffs" ON public.project_signoffs;
DROP POLICY IF EXISTS "Insert signoffs" ON public.project_signoffs;
DROP POLICY IF EXISTS "Update unsigned signoffs" ON public.project_signoffs;

-- 5. RLS Policies for project members and organization owners
CREATE POLICY "Select signoffs"
  ON public.project_signoffs FOR SELECT
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

CREATE POLICY "Insert signoffs"
  ON public.project_signoffs FOR INSERT
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

-- 6. Structural Immutability Enforcement Trigger
-- Once signed_at is stamped, any UPDATE or DELETE attempt at the DB level is blocked.
CREATE OR REPLACE FUNCTION public.enforce_signoff_immutability()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Immutable Compliance Error: A completed project closure sign-off record cannot be modified or deleted once executed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_signoff_immutability ON public.project_signoffs;
CREATE TRIGGER trigger_enforce_signoff_immutability
  BEFORE UPDATE OR DELETE ON public.project_signoffs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_signoff_immutability();
