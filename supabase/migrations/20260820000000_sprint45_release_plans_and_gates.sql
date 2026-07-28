-- Sprint 45: Release Plan Module — Readiness Checklist, Approval Gate & Deployment/Rollback Plans

-- 1. Extend the Approval Workflows action_type to support 'release_promotion'
ALTER TABLE public.approval_policies DROP CONSTRAINT IF EXISTS approval_policies_action_type_check;
ALTER TABLE public.approval_policies ADD CONSTRAINT approval_policies_action_type_check 
  CHECK (action_type IN ('budget_baseline', 'schedule_baseline', 'release_promotion'));

-- 2. Organization Release Readiness Templates
CREATE TABLE IF NOT EXISTS public.org_release_readiness_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_org_release_readiness_templates_org ON public.org_release_readiness_templates(organization_id);

ALTER TABLE public.org_release_readiness_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view release readiness templates"
    ON public.org_release_readiness_templates FOR SELECT
    USING (
        public.get_user_role_in_org(organization_id, auth.uid()) IS NOT NULL
        OR (SELECT owner_id FROM public.organizations WHERE id = organization_id) = auth.uid()
    );

CREATE POLICY "Org admins can manage release readiness templates"
    ON public.org_release_readiness_templates FOR ALL
    USING (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        OR (SELECT owner_id FROM public.organizations WHERE id = organization_id) = auth.uid()
    )
    WITH CHECK (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        OR (SELECT owner_id FROM public.organizations WHERE id = organization_id) = auth.uid()
    );

-- 3. Release Readiness Items
CREATE TABLE IF NOT EXISTS public.release_readiness_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_text TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    checked_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_release_readiness_items_release ON public.release_readiness_items(release_id);

ALTER TABLE public.release_readiness_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view release readiness items"
    ON public.release_readiness_items FOR SELECT
    USING (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    );

CREATE POLICY "Project members can manage release readiness items"
    ON public.release_readiness_items FOR ALL
    USING (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    )
    WITH CHECK (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    );

-- 4. Release Deployment Plans
CREATE TABLE IF NOT EXISTS public.release_deployment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
    phase TEXT NOT NULL CHECK (phase IN ('Before', 'During', 'After')),
    step_text TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_release_deployment_plans_release ON public.release_deployment_plans(release_id);

ALTER TABLE public.release_deployment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view release deployment plans"
    ON public.release_deployment_plans FOR SELECT
    USING (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    );

CREATE POLICY "Project members can manage release deployment plans"
    ON public.release_deployment_plans FOR ALL
    USING (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    )
    WITH CHECK (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    );

-- 5. Release Rollback Plans
CREATE TABLE IF NOT EXISTS public.release_rollback_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
    step_text TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_release_rollback_plans_release ON public.release_rollback_plans(release_id);

ALTER TABLE public.release_rollback_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view release rollback plans"
    ON public.release_rollback_plans FOR SELECT
    USING (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    );

CREATE POLICY "Project members can manage release rollback plans"
    ON public.release_rollback_plans FOR ALL
    USING (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    )
    WITH CHECK (
        public.is_project_member((SELECT project_id FROM public.releases WHERE id = release_id), auth.uid())
    );
