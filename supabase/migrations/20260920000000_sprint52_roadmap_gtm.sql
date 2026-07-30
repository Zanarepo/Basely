-- Sprint 52: Outcome-Driven Roadmap & GTM Feature Rollouts

-- 1. Create Roadmap Horizon Enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roadmap_horizon') THEN
    CREATE TYPE public.roadmap_horizon AS ENUM ('Now', 'Next', 'Later');
  END IF;
END $$;

-- 2. Alter product_backlog_items
ALTER TABLE public.product_backlog_items 
ADD COLUMN IF NOT EXISTS horizon public.roadmap_horizon,
ADD COLUMN IF NOT EXISTS theme text,
ADD COLUMN IF NOT EXISTS release_id uuid REFERENCES public.releases(id) ON DELETE SET NULL;

-- 3. Create release_rollout_phases table
CREATE TABLE IF NOT EXISTS public.release_rollout_phases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id uuid REFERENCES public.releases(id) ON DELETE CASCADE NOT NULL,
    phase_name text NOT NULL,
    target_percentage numeric NOT NULL DEFAULT 100,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'complete')),
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create release_feature_flags table
CREATE TABLE IF NOT EXISTS public.release_feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id uuid REFERENCES public.releases(id) ON DELETE CASCADE NOT NULL,
    flag_key text NOT NULL,
    description text,
    is_enabled boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (release_id, flag_key)
);

-- 5. RLS Policies
ALTER TABLE public.release_rollout_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_feature_flags ENABLE ROW LEVEL SECURITY;

-- Rollout Phases Policies
DROP POLICY IF EXISTS "Users can view rollout phases in their projects" ON public.release_rollout_phases;
CREATE POLICY "Users can view rollout phases in their projects"
    ON public.release_rollout_phases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.releases r
            JOIN public.organization_members om ON om.organization_id = (SELECT organization_id FROM public.projects WHERE id = r.project_id)
            WHERE r.id = release_rollout_phases.release_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage rollout phases in their projects" ON public.release_rollout_phases;
CREATE POLICY "Users can manage rollout phases in their projects"
    ON public.release_rollout_phases FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.releases r
            JOIN public.organization_members om ON om.organization_id = (SELECT organization_id FROM public.projects WHERE id = r.project_id)
            WHERE r.id = release_rollout_phases.release_id
            AND om.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.releases r
            JOIN public.organization_members om ON om.organization_id = (SELECT organization_id FROM public.projects WHERE id = r.project_id)
            WHERE r.id = release_rollout_phases.release_id
            AND om.user_id = auth.uid()
        )
    );

-- Feature Flags Policies
DROP POLICY IF EXISTS "Users can view feature flags in their projects" ON public.release_feature_flags;
CREATE POLICY "Users can view feature flags in their projects"
    ON public.release_feature_flags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.releases r
            JOIN public.organization_members om ON om.organization_id = (SELECT organization_id FROM public.projects WHERE id = r.project_id)
            WHERE r.id = release_feature_flags.release_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage feature flags in their projects" ON public.release_feature_flags;
CREATE POLICY "Users can manage feature flags in their projects"
    ON public.release_feature_flags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.releases r
            JOIN public.organization_members om ON om.organization_id = (SELECT organization_id FROM public.projects WHERE id = r.project_id)
            WHERE r.id = release_feature_flags.release_id
            AND om.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.releases r
            JOIN public.organization_members om ON om.organization_id = (SELECT organization_id FROM public.projects WHERE id = r.project_id)
            WHERE r.id = release_feature_flags.release_id
            AND om.user_id = auth.uid()
        )
    );

-- 6. Realtime Publications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'release_rollout_phases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.release_rollout_phases;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'release_feature_flags'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.release_feature_flags;
  END IF;
END $$;
