-- Migration: Voice-of-Customer Discovery Log & PRD Studio (Sprint 50)
-- Version: 20260910000000_sprint50_discovery_prd

BEGIN;

-- ============================================================
-- 1. Discovery Insights (Voice of Customer / Feedback Logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discovery_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT DEFAULT 'customer_interview', -- customer_interview, support_ticket, sales_call, user_research, survey, analytics, other
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    frequency INTEGER DEFAULT 1, -- how often this insight has been reported
    persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'new', -- new, triaged, in_review, converted, archived
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 2. Product Requirements Document Metadata
--    (Extends the core documents table with PRD-specific relational data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_requirements_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES public.generated_documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    primary_okr_id UUID REFERENCES public.okr_objectives(id) ON DELETE SET NULL,
    target_persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    figma_url TEXT,
    telemetry_requirements JSONB DEFAULT '[]'::jsonb,
    scope_in TEXT[] DEFAULT '{}',
    scope_out TEXT[] DEFAULT '{}',
    acceptance_criteria TEXT[] DEFAULT '{}',
    prd_status TEXT DEFAULT 'draft', -- draft, in_review, approved, deprecated
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 3. Discovery-to-ChangeRequest junction (Project Bridge)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discovery_change_request_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_insight_id UUID REFERENCES public.discovery_insights(id) ON DELETE CASCADE NOT NULL,
    change_request_id UUID REFERENCES public.change_request_log_entries(id) ON DELETE CASCADE NOT NULL,
    link_type TEXT DEFAULT 'converted_from', -- converted_from, supporting_context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(discovery_insight_id, change_request_id)
);

-- ============================================================
-- 4. Discovery-to-Risk junction (Project Bridge)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discovery_risk_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discovery_insight_id UUID REFERENCES public.discovery_insights(id) ON DELETE CASCADE NOT NULL,
    risk_id UUID REFERENCES public.risks(id) ON DELETE CASCADE NOT NULL,
    link_type TEXT DEFAULT 'supporting_context', -- supporting_context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(discovery_insight_id, risk_id)
);

-- ============================================================
-- 5. Enable Row Level Security
-- ============================================================
ALTER TABLE public.discovery_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requirements_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_change_request_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_risk_links ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS Policies for discovery_insights
-- ============================================================
DROP POLICY IF EXISTS "Allow members to read organization discovery_insights" ON public.discovery_insights;
CREATE POLICY "Allow members to read organization discovery_insights"
    ON public.discovery_insights FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to insert discovery_insights" ON public.discovery_insights;
CREATE POLICY "Allow members to insert discovery_insights"
    ON public.discovery_insights FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to update discovery_insights" ON public.discovery_insights;
CREATE POLICY "Allow members to update discovery_insights"
    ON public.discovery_insights FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to delete discovery_insights" ON public.discovery_insights;
CREATE POLICY "Allow members to delete discovery_insights"
    ON public.discovery_insights FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

-- ============================================================
-- 7. RLS Policies for product_requirements_docs
-- ============================================================
DROP POLICY IF EXISTS "Allow members to read organization product_requirements_docs" ON public.product_requirements_docs;
CREATE POLICY "Allow members to read organization product_requirements_docs"
    ON public.product_requirements_docs FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to insert product_requirements_docs" ON public.product_requirements_docs;
CREATE POLICY "Allow members to insert product_requirements_docs"
    ON public.product_requirements_docs FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to update product_requirements_docs" ON public.product_requirements_docs;
CREATE POLICY "Allow members to update product_requirements_docs"
    ON public.product_requirements_docs FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

DROP POLICY IF EXISTS "Allow members to delete product_requirements_docs" ON public.product_requirements_docs;
CREATE POLICY "Allow members to delete product_requirements_docs"
    ON public.product_requirements_docs FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid())));

-- ============================================================
-- 8. RLS Policies for junction tables (via parent discovery_insight org check)
-- ============================================================
DROP POLICY IF EXISTS "Allow members to manage discovery_change_request_links" ON public.discovery_change_request_links;
CREATE POLICY "Allow members to manage discovery_change_request_links"
    ON public.discovery_change_request_links FOR ALL
    USING (discovery_insight_id IN (
        SELECT id FROM public.discovery_insights
        WHERE organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
    ));

DROP POLICY IF EXISTS "Allow members to manage discovery_risk_links" ON public.discovery_risk_links;
CREATE POLICY "Allow members to manage discovery_risk_links"
    ON public.discovery_risk_links FOR ALL
    USING (discovery_insight_id IN (
        SELECT id FROM public.discovery_insights
        WHERE organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
    ));

-- ============================================================
-- 9. Indexes for performant workspace queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_discovery_insights_org ON public.discovery_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_discovery_insights_proj ON public.discovery_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_discovery_insights_persona ON public.discovery_insights(persona_id);
CREATE INDEX IF NOT EXISTS idx_discovery_insights_status ON public.discovery_insights(status);
CREATE INDEX IF NOT EXISTS idx_product_requirements_docs_org ON public.product_requirements_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_requirements_docs_proj ON public.product_requirements_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_product_requirements_docs_doc ON public.product_requirements_docs(document_id);
CREATE INDEX IF NOT EXISTS idx_discovery_cr_links_insight ON public.discovery_change_request_links(discovery_insight_id);
CREATE INDEX IF NOT EXISTS idx_discovery_risk_links_insight ON public.discovery_risk_links(discovery_insight_id);

COMMIT;
