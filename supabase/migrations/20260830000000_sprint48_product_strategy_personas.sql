-- Migration: Product Strategy Canvases & Customer Personas (Sprint 48)
-- Version: 20260830000000_sprint48_product_strategy_personas

BEGIN;

-- 1. Create Personas table
CREATE TABLE IF NOT EXISTS public.personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- Nullable, allows organization-level reuse
    name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#6366f1',
    demographics TEXT,
    jtbd_statement TEXT,
    motivations TEXT,
    pain_points TEXT,
    preferred_tools TEXT,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Product Strategies table (Vision Canvas)
CREATE TABLE IF NOT EXISTS public.product_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    vision_statement TEXT,
    target_market TEXT,
    value_proposition TEXT,
    strategic_pillars JSONB DEFAULT '[]'::jsonb,
    competitive_moats JSONB DEFAULT '[]'::jsonb,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_project_strategy UNIQUE(project_id)
);

-- Safely add custom_attributes if tables already existed in early testing
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.product_strategies ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

-- 3. Enable RLS
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_strategies ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Personas (with full idempotency)
DROP POLICY IF EXISTS "Allow members to read organization personas" ON public.personas;
CREATE POLICY "Allow members to read organization personas"
    ON public.personas FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to insert personas" ON public.personas;
CREATE POLICY "Allow members to insert personas"
    ON public.personas FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow creator or Admins/PM to update personas" ON public.personas;
CREATE POLICY "Allow creator or Admins/PM to update personas"
    ON public.personas FOR UPDATE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

DROP POLICY IF EXISTS "Allow creator or Admins/PM to delete personas" ON public.personas;
CREATE POLICY "Allow creator or Admins/PM to delete personas"
    ON public.personas FOR DELETE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

-- 5. RLS Policies for Product Strategies (with full idempotency)
DROP POLICY IF EXISTS "Allow members to read organization product strategies" ON public.product_strategies;
CREATE POLICY "Allow members to read organization product strategies"
    ON public.product_strategies FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to insert product strategies" ON public.product_strategies;
CREATE POLICY "Allow members to insert product strategies"
    ON public.product_strategies FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow creator or Admins/PM to update product strategies" ON public.product_strategies;
CREATE POLICY "Allow creator or Admins/PM to update product strategies"
    ON public.product_strategies FOR UPDATE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

DROP POLICY IF EXISTS "Allow creator or Admins/PM to delete product strategies" ON public.product_strategies;
CREATE POLICY "Allow creator or Admins/PM to delete product strategies"
    ON public.product_strategies FOR DELETE
    USING (
        created_by = auth.uid() OR 
        public.get_user_role_in_org(organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
    );

-- 6. Triggers for updated_at (with full idempotency)
DROP TRIGGER IF EXISTS tr_personas_updated_at ON public.personas;
CREATE TRIGGER tr_personas_updated_at
BEFORE UPDATE ON public.personas
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS tr_product_strategies_updated_at ON public.product_strategies;
CREATE TRIGGER tr_product_strategies_updated_at
BEFORE UPDATE ON public.product_strategies
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- 7. Enable Realtime for collaborative edits
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete');
  END IF;
END
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.personas;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_strategies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
