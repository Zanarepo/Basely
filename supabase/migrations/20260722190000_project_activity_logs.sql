DO $$ BEGIN
  CREATE TYPE public.activity_entity_type AS ENUM (
    'project',
    'wbs_element',
    'activity',
    'cost_account',
    'baseline',
    'budget_baseline',
    'schedule_baseline',
    'actuals',
    'estimations',
    'resources',
    'stakeholder',
    'raci',
    'risk',
    'issue',
    'document',
    'status_report',
    'approval_request',
    'comment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_action_type AS ENUM (
    'created',
    'updated',
    'deleted',
    'uploaded',
    'approved',
    'rejected',
    'published'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.project_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type public.activity_entity_type NOT NULL,
  entity_id TEXT NOT NULL,
  action public.activity_action_type NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT project_activity_logs_pkey PRIMARY KEY (id)
);

-- Index for quickly fetching chronological feeds per project
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_project_id_time ON public.project_activity_logs (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_entity ON public.project_activity_logs (project_id, entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.project_activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert from authenticated (application layer)
DO $$ BEGIN
  CREATE POLICY "Enable insert for authenticated users" 
  ON public.project_activity_logs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Allow select ONLY if user can read the project
DO $$ BEGIN
  CREATE POLICY "Project members can view activity logs"
  ON public.project_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    public.can_user_read_project(project_id, auth.uid())
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
