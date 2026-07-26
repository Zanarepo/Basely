-- 1. quality_management_plans
CREATE TABLE IF NOT EXISTS public.quality_management_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    review_cadence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id)
);

ALTER TABLE public.quality_management_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality plans for their projects"
    ON public.quality_management_plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = quality_management_plans.project_id
            AND project_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            JOIN public.organization_members om ON o.id = om.organization_id
            WHERE p.id = quality_management_plans.project_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Project editors can insert quality plans"
    ON public.quality_management_plans
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = quality_management_plans.project_id
            AND project_members.user_id = auth.uid()
            AND (project_members.can_edit_documents = true OR project_members.project_role_title = 'Project Manager')
        )
    );

CREATE POLICY "Project editors can update quality plans"
    ON public.quality_management_plans
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = quality_management_plans.project_id
            AND project_members.user_id = auth.uid()
            AND (project_members.can_edit_documents = true OR project_members.project_role_title = 'Project Manager')
        )
    );

CREATE TRIGGER handle_updated_at_quality_plans
    BEFORE UPDATE ON public.quality_management_plans
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 2. quality_standards
CREATE TABLE IF NOT EXISTS public.quality_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.quality_management_plans(id) ON DELETE CASCADE,
    criterion_text TEXT NOT NULL,
    is_checklist_item BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.quality_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality standards for their projects"
    ON public.quality_standards
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.project_members pm ON pm.project_id = qmp.project_id
            WHERE qmp.id = quality_standards.plan_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project editors can insert quality standards"
    ON public.quality_standards
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.project_members pm ON pm.project_id = qmp.project_id
            WHERE qmp.id = quality_standards.plan_id
            AND pm.user_id = auth.uid()
            AND (pm.can_edit_documents = true OR pm.project_role_title = 'Project Manager')
        )
    );

CREATE POLICY "Project editors can update quality standards"
    ON public.quality_standards
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.project_members pm ON pm.project_id = qmp.project_id
            WHERE qmp.id = quality_standards.plan_id
            AND pm.user_id = auth.uid()
            AND (pm.can_edit_documents = true OR pm.project_role_title = 'Project Manager')
        )
    );

CREATE POLICY "Project editors can delete quality standards"
    ON public.quality_standards
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.project_members pm ON pm.project_id = qmp.project_id
            WHERE qmp.id = quality_standards.plan_id
            AND pm.user_id = auth.uid()
            AND (pm.can_edit_documents = true OR pm.project_role_title = 'Project Manager')
        )
    );

CREATE TRIGGER handle_updated_at_quality_standards
    BEFORE UPDATE ON public.quality_standards
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 3. wbs_quality_standard_links
CREATE TABLE IF NOT EXISTS public.wbs_quality_standard_links (
    wbs_element_id UUID NOT NULL REFERENCES public.wbs_elements(id) ON DELETE CASCADE,
    quality_standard_id UUID NOT NULL REFERENCES public.quality_standards(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (wbs_element_id, quality_standard_id)
);

ALTER TABLE public.wbs_quality_standard_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links"
    ON public.wbs_quality_standard_links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.wbs_elements w
            JOIN public.project_members pm ON pm.project_id = w.project_id
            WHERE w.id = wbs_quality_standard_links.wbs_element_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project editors can insert links"
    ON public.wbs_quality_standard_links
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wbs_elements w
            JOIN public.project_members pm ON pm.project_id = w.project_id
            WHERE w.id = wbs_quality_standard_links.wbs_element_id
            AND pm.user_id = auth.uid()
            AND (pm.can_edit_documents = true OR pm.project_role_title = 'Project Manager')
        )
    );

CREATE POLICY "Project editors can delete links"
    ON public.wbs_quality_standard_links
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.wbs_elements w
            JOIN public.project_members pm ON pm.project_id = w.project_id
            WHERE w.id = wbs_quality_standard_links.wbs_element_id
            AND pm.user_id = auth.uid()
            AND (pm.can_edit_documents = true OR pm.project_role_title = 'Project Manager')
        )
    );

-- 4. procurement_entries
CREATE TABLE IF NOT EXISTS public.procurement_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    contract_scope TEXT,
    cost NUMERIC(14,2),
    linked_cost_account_id UUID REFERENCES public.cost_accounts(id) ON DELETE SET NULL,
    key_dates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.procurement_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view procurement entries for their projects"
    ON public.procurement_entries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = procurement_entries.project_id
            AND project_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            JOIN public.organization_members om ON o.id = om.organization_id
            WHERE p.id = procurement_entries.project_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Project editors can insert procurement entries"
    ON public.procurement_entries
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = procurement_entries.project_id
            AND project_members.user_id = auth.uid()
            AND (project_members.can_edit_documents = true OR project_members.project_role_title = 'Project Manager')
        )
    );

CREATE POLICY "Project editors can update procurement entries"
    ON public.procurement_entries
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = procurement_entries.project_id
            AND project_members.user_id = auth.uid()
            AND (project_members.can_edit_documents = true OR project_members.project_role_title = 'Project Manager')
        )
    );

CREATE POLICY "Project editors can delete procurement entries"
    ON public.procurement_entries
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = procurement_entries.project_id
            AND project_members.user_id = auth.uid()
            AND (project_members.can_edit_documents = true OR project_members.project_role_title = 'Project Manager')
        )
    );

CREATE TRIGGER handle_updated_at_procurement_entries
    BEFORE UPDATE ON public.procurement_entries
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
