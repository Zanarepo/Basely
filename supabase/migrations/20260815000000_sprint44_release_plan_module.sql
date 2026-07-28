-- Migration: Sprint 44 Release Plan Module — Release & Iteration Data Model
-- Version: 20260815000000_sprint44_release_plan_module

ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'iteration';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'release';

-- 1. Iterations Table (Unified schema for Agile Sprints, Waterfall Phases, and Hybrid Iterations)
CREATE TABLE IF NOT EXISTS public.iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  label_override TEXT CHECK (label_override IN ('sprint', 'phase')) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add nullable iteration_id foreign key to wbs_elements and activities
ALTER TABLE public.wbs_elements
  ADD COLUMN IF NOT EXISTS iteration_id UUID REFERENCES public.iterations(id) ON DELETE SET NULL;

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS iteration_id UUID REFERENCES public.iterations(id) ON DELETE SET NULL;

-- 3. Releases Table (Supports planned, in_progress, released, rolled_back, canceled)
CREATE TABLE IF NOT EXISTS public.releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'released', 'rolled_back', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Release-Iterations Many-to-Many Join Table
CREATE TABLE IF NOT EXISTS public.release_iterations (
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  iteration_id UUID NOT NULL REFERENCES public.iterations(id) ON DELETE CASCADE,
  PRIMARY KEY (release_id, iteration_id)
);

-- 5. Release Exit Criteria Table
CREATE TABLE IF NOT EXISTS public.release_exit_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  criterion_text TEXT NOT NULL,
  is_met BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Release Manual Scope Overrides Table
CREATE TABLE IF NOT EXISTS public.release_manual_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('wbs_element', 'activity', 'custom_item')),
  entity_id UUID NULL,
  title TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'added' CHECK (action IN ('added', 'excluded')),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on all new tables
ALTER TABLE public.iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_exit_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_manual_scope ENABLE ROW LEVEL SECURITY;

-- RLS Policies for iterations
CREATE POLICY "Users can view iterations for accessible projects"
  ON public.iterations FOR SELECT
  USING (public.can_user_read_project(project_id, auth.uid()));

CREATE POLICY "Users can manage iterations for accessible projects"
  ON public.iterations FOR ALL
  USING (public.can_user_read_project(project_id, auth.uid()));

-- RLS Policies for releases
CREATE POLICY "Users can view releases for accessible projects"
  ON public.releases FOR SELECT
  USING (public.can_user_read_project(project_id, auth.uid()));

CREATE POLICY "Users can manage releases for accessible projects"
  ON public.releases FOR ALL
  USING (public.can_user_read_project(project_id, auth.uid()));

-- RLS Policies for release_iterations
CREATE POLICY "Users can view release iterations"
  ON public.release_iterations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.releases r
    WHERE r.id = release_iterations.release_id
    AND public.can_user_read_project(r.project_id, auth.uid())
  ));

CREATE POLICY "Users can manage release iterations"
  ON public.release_iterations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.releases r
    WHERE r.id = release_iterations.release_id
    AND public.can_user_read_project(r.project_id, auth.uid())
  ));

-- RLS Policies for release_exit_criteria
CREATE POLICY "Users can view release exit criteria"
  ON public.release_exit_criteria FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.releases r
    WHERE r.id = release_exit_criteria.release_id
    AND public.can_user_read_project(r.project_id, auth.uid())
  ));

CREATE POLICY "Users can manage release exit criteria"
  ON public.release_exit_criteria FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.releases r
    WHERE r.id = release_exit_criteria.release_id
    AND public.can_user_read_project(r.project_id, auth.uid())
  ));

-- RLS Policies for release_manual_scope
CREATE POLICY "Users can view release manual scope"
  ON public.release_manual_scope FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.releases r
    WHERE r.id = release_manual_scope.release_id
    AND public.can_user_read_project(r.project_id, auth.uid())
  ));

CREATE POLICY "Users can manage release manual scope"
  ON public.release_manual_scope FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.releases r
    WHERE r.id = release_manual_scope.release_id
    AND public.can_user_read_project(r.project_id, auth.uid())
  ));

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.iterations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.releases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.release_iterations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.release_exit_criteria;
ALTER PUBLICATION supabase_realtime ADD TABLE public.release_manual_scope;
