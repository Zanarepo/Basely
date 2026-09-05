-- Migration: Create Sprint Snapshots for Agile Charts

CREATE TABLE IF NOT EXISTS public.sprint_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  iteration_id UUID NOT NULL REFERENCES public.iterations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_items INTEGER NOT NULL DEFAULT 0,
  completed_items INTEGER NOT NULL DEFAULT 0,
  in_progress_items INTEGER NOT NULL DEFAULT 0,
  planned_items INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(iteration_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.sprint_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to project members
CREATE POLICY "Allow read access to project members for sprint_snapshots" ON public.sprint_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = sprint_snapshots.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Policy: Allow write access to project members
CREATE POLICY "Allow insert access to project members for sprint_snapshots" ON public.sprint_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = sprint_snapshots.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow update access to project members for sprint_snapshots" ON public.sprint_snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = sprint_snapshots.project_id
      AND project_members.user_id = auth.uid()
    )
  );
