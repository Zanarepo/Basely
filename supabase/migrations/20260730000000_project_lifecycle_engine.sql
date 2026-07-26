-- Migration: Project Lifecycle Status Engine & Transition Audit Log
-- Version: 20260730000000_project_lifecycle_engine

-- 1. Add lifecycle_status to public.projects with strict validation check
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'Initiating'
  CHECK (lifecycle_status IN (
    'Initiating',
    'Planning',
    'Executing',
    'Monitoring & Controlling',
    'Closing',
    'Closed'
  ));

-- 2. Backfill existing active projects to 'Executing' so all ongoing core operations remain fully unblocked
UPDATE public.projects 
SET lifecycle_status = 'Executing' 
WHERE lifecycle_status = 'Initiating';

-- 3. Create project_lifecycle_transitions audit table for immutable historical records
CREATE TABLE IF NOT EXISTS public.project_lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT,
  is_override BOOLEAN NOT NULL DEFAULT false,
  transitioned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create indices for high-performance timeline retrieval and auditing
CREATE INDEX IF NOT EXISTS idx_project_lifecycle_transitions_project_id ON public.project_lifecycle_transitions(project_id, created_at DESC);

-- 5. Enable Row Level Security on lifecycle transition logs
ALTER TABLE public.project_lifecycle_transitions ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if re-running
DROP POLICY IF EXISTS "Select lifecycle transitions" ON public.project_lifecycle_transitions;
DROP POLICY IF EXISTS "Insert lifecycle transitions" ON public.project_lifecycle_transitions;
DROP POLICY IF EXISTS "No update or delete on lifecycle transitions" ON public.project_lifecycle_transitions;

-- 7. RLS Policies: Read access for workspace owners, project creators, and project members
CREATE POLICY "Select lifecycle transitions"
  ON public.project_lifecycle_transitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_lifecycle_transitions.project_id
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

-- 8. RLS Policies: Insert access for workspace admins, project creators, and project managers
CREATE POLICY "Insert lifecycle transitions"
  ON public.project_lifecycle_transitions FOR INSERT
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
