-- Migration: OKRs & North Star KPI Engine (Sprint 49)
-- Version: 20260905000000_sprint49_okrs_kpis

BEGIN;

-- 1. Create Product KPIs table (North Star & Growth Levers)
CREATE TABLE IF NOT EXISTS public.product_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'north_star', -- north_star, acquisition, activation, retention, revenue, efficiency
    current_value TEXT DEFAULT '0',
    target_value TEXT DEFAULT '100',
    unit TEXT DEFAULT 'numeric', -- percentage, currency, numeric, ratio
    frequency TEXT DEFAULT 'monthly', -- daily, weekly, monthly, quarterly
    trend_direction TEXT DEFAULT 'up', -- up, down, neutral
    status TEXT DEFAULT 'on_track', -- on_track, at_risk, behind
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create OKR Objectives table
CREATE TABLE IF NOT EXISTS public.okr_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    pillar_id TEXT, -- Linked to Sprint 48 Strategic Pillar ID
    wbs_element_id TEXT, -- Optional alignment to WBS execution element
    owner TEXT,
    timeframe TEXT DEFAULT 'Q3 2026',
    progress INTEGER DEFAULT 0, -- 0 to 100 percentage
    status TEXT DEFAULT 'on_track', -- on_track, at_risk, behind
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create OKR Key Results table
CREATE TABLE IF NOT EXISTS public.okr_key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID REFERENCES public.okr_objectives(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    baseline_value TEXT DEFAULT '0',
    target_value TEXT DEFAULT '100',
    current_value TEXT DEFAULT '0',
    progress INTEGER DEFAULT 0, -- 0 to 100 percentage
    confidence_score INTEGER DEFAULT 80, -- 0 to 100% confidence
    unit TEXT DEFAULT 'numeric', -- percentage, currency, numeric, ratio
    status TEXT DEFAULT 'on_track', -- on_track, at_risk, behind
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely ensure columns exist if tables were previously created during partial development
ALTER TABLE public.product_kpis ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.okr_objectives ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.okr_key_results ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.okr_objectives ADD COLUMN IF NOT EXISTS wbs_element_id TEXT;

-- 4. Enable Row Level Security
ALTER TABLE public.product_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okr_key_results ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Product KPIs (Idempotent)
DROP POLICY IF EXISTS "Allow members to read organization product_kpis" ON public.product_kpis;
CREATE POLICY "Allow members to read organization product_kpis"
    ON public.product_kpis FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to insert product_kpis" ON public.product_kpis;
CREATE POLICY "Allow members to insert product_kpis"
    ON public.product_kpis FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to update product_kpis" ON public.product_kpis;
CREATE POLICY "Allow members to update product_kpis"
    ON public.product_kpis FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to delete product_kpis" ON public.product_kpis;
CREATE POLICY "Allow members to delete product_kpis"
    ON public.product_kpis FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

-- 6. RLS Policies for OKR Objectives (Idempotent)
DROP POLICY IF EXISTS "Allow members to read organization okr_objectives" ON public.okr_objectives;
CREATE POLICY "Allow members to read organization okr_objectives"
    ON public.okr_objectives FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to insert okr_objectives" ON public.okr_objectives;
CREATE POLICY "Allow members to insert okr_objectives"
    ON public.okr_objectives FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to update okr_objectives" ON public.okr_objectives;
CREATE POLICY "Allow members to update okr_objectives"
    ON public.okr_objectives FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to delete okr_objectives" ON public.okr_objectives;
CREATE POLICY "Allow members to delete okr_objectives"
    ON public.okr_objectives FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

-- 7. RLS Policies for OKR Key Results (Idempotent via parent Objective organization check)
DROP POLICY IF EXISTS "Allow members to read okr_key_results" ON public.okr_key_results;
CREATE POLICY "Allow members to read okr_key_results"
    ON public.okr_key_results FOR SELECT
    USING (objective_id IN (
        SELECT id FROM public.okr_objectives 
        WHERE organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
    ));

DROP POLICY IF EXISTS "Allow members to insert okr_key_results" ON public.okr_key_results;
CREATE POLICY "Allow members to insert okr_key_results"
    ON public.okr_key_results FOR INSERT
    WITH CHECK (objective_id IN (
        SELECT id FROM public.okr_objectives 
        WHERE organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
    ));

DROP POLICY IF EXISTS "Allow members to update okr_key_results" ON public.okr_key_results;
CREATE POLICY "Allow members to update okr_key_results"
    ON public.okr_key_results FOR UPDATE
    USING (objective_id IN (
        SELECT id FROM public.okr_objectives 
        WHERE organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
    ));

DROP POLICY IF EXISTS "Allow members to delete okr_key_results" ON public.okr_key_results;
CREATE POLICY "Allow members to delete okr_key_results"
    ON public.okr_key_results FOR DELETE
    USING (objective_id IN (
        SELECT id FROM public.okr_objectives 
        WHERE organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
    ));

-- 8. Indexes for faster real-time workspace queries
CREATE INDEX IF NOT EXISTS idx_product_kpis_org ON public.product_kpis(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_kpis_proj ON public.product_kpis(project_id);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_org ON public.okr_objectives(organization_id);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_proj ON public.okr_objectives(project_id);
CREATE INDEX IF NOT EXISTS idx_okr_key_results_obj ON public.okr_key_results(objective_id);

COMMIT;
