-- Sprint 51: Feature Prioritization & Backlog Scoring Engine (RICE)

-- 1. Add AI Governance Toggle to Organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS ai_wbs_generation_enabled boolean NOT NULL DEFAULT false;

-- 2. Create Enums for MoSCoW and Kano
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moscow_status') THEN
    CREATE TYPE public.moscow_status AS ENUM ('Must', 'Should', 'Could', 'Wont');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kano_category') THEN
    CREATE TYPE public.kano_category AS ENUM ('Basic', 'Performance', 'Excitement', 'Indifferent');
  END IF;
END $$;

-- 3. Create product_backlog_items table
CREATE TABLE IF NOT EXISTS public.product_backlog_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    
    title text NOT NULL,
    description text,
    
    persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
    primary_okr_id uuid REFERENCES public.okr_objectives(id) ON DELETE SET NULL,
    
    reach numeric NOT NULL DEFAULT 1,
    impact numeric NOT NULL DEFAULT 1,
    confidence numeric NOT NULL DEFAULT 100, -- percentage 0-100
    effort numeric NOT NULL DEFAULT 1,
    
    rice_score numeric GENERATED ALWAYS AS (
      (reach * impact * (confidence / 100.0)) / NULLIF(effort, 0)
    ) STORED,
    
    moscow_status public.moscow_status,
    kano_category public.kano_category,
    
    wbs_element_id uuid REFERENCES public.wbs_elements(id) ON DELETE SET NULL,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_backlog_project ON public.product_backlog_items(project_id);
CREATE INDEX IF NOT EXISTS idx_backlog_rice ON public.product_backlog_items(rice_score DESC);
CREATE INDEX IF NOT EXISTS idx_backlog_wbs ON public.product_backlog_items(wbs_element_id);

-- 5. Enable RLS
ALTER TABLE public.product_backlog_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "Users can view backlog items in their projects" ON public.product_backlog_items;
CREATE POLICY "Users can view backlog items in their projects"
    ON public.product_backlog_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert backlog items in their projects" ON public.product_backlog_items;
CREATE POLICY "Users can insert backlog items in their projects"
    ON public.product_backlog_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update backlog items in their projects" ON public.product_backlog_items;
CREATE POLICY "Users can update backlog items in their projects"
    ON public.product_backlog_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete backlog items in their projects" ON public.product_backlog_items;
CREATE POLICY "Users can delete backlog items in their projects"
    ON public.product_backlog_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- 7. Add to realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'product_backlog_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_backlog_items;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'organizations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
  END IF;
END $$;
