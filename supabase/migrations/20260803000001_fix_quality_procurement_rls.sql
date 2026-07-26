-- Drop existing policies
DROP POLICY IF EXISTS "Project editors can insert quality plans" ON public.quality_management_plans;
DROP POLICY IF EXISTS "Project editors can update quality plans" ON public.quality_management_plans;

DROP POLICY IF EXISTS "Project editors can insert quality standards" ON public.quality_standards;
DROP POLICY IF EXISTS "Project editors can update quality standards" ON public.quality_standards;
DROP POLICY IF EXISTS "Project editors can delete quality standards" ON public.quality_standards;

DROP POLICY IF EXISTS "Project editors can insert wbs quality standard links" ON public.wbs_quality_standard_links;
DROP POLICY IF EXISTS "Project editors can delete wbs quality standard links" ON public.wbs_quality_standard_links;

DROP POLICY IF EXISTS "Project editors can insert procurement entries" ON public.procurement_entries;
DROP POLICY IF EXISTS "Project editors can update procurement entries" ON public.procurement_entries;
DROP POLICY IF EXISTS "Project editors can delete procurement entries" ON public.procurement_entries;

-- 1. quality_management_plans
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
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = quality_management_plans.project_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = quality_management_plans.project_id
            AND p.created_by = auth.uid()
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
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = quality_management_plans.project_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = quality_management_plans.project_id
            AND p.created_by = auth.uid()
        )
    );

-- 2. quality_standards
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
        OR EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.projects p ON p.id = qmp.project_id
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE qmp.id = quality_standards.plan_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.projects p ON p.id = qmp.project_id
            WHERE qmp.id = quality_standards.plan_id
            AND p.created_by = auth.uid()
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
        OR EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.projects p ON p.id = qmp.project_id
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE qmp.id = quality_standards.plan_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.projects p ON p.id = qmp.project_id
            WHERE qmp.id = quality_standards.plan_id
            AND p.created_by = auth.uid()
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
        OR EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.projects p ON p.id = qmp.project_id
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE qmp.id = quality_standards.plan_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.quality_management_plans qmp
            JOIN public.projects p ON p.id = qmp.project_id
            WHERE qmp.id = quality_standards.plan_id
            AND p.created_by = auth.uid()
        )
    );

-- 3. wbs_quality_standard_links
CREATE POLICY "Project editors can insert wbs quality standard links"
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
        OR EXISTS (
            SELECT 1 FROM public.wbs_elements w
            JOIN public.projects p ON p.id = w.project_id
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE w.id = wbs_quality_standard_links.wbs_element_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.wbs_elements w
            JOIN public.projects p ON p.id = w.project_id
            WHERE w.id = wbs_quality_standard_links.wbs_element_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Project editors can delete wbs quality standard links"
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
        OR EXISTS (
            SELECT 1 FROM public.wbs_elements w
            JOIN public.projects p ON p.id = w.project_id
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE w.id = wbs_quality_standard_links.wbs_element_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.wbs_elements w
            JOIN public.projects p ON p.id = w.project_id
            WHERE w.id = wbs_quality_standard_links.wbs_element_id
            AND p.created_by = auth.uid()
        )
    );


-- 4. procurement_entries
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
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = procurement_entries.project_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = procurement_entries.project_id
            AND p.created_by = auth.uid()
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
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = procurement_entries.project_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = procurement_entries.project_id
            AND p.created_by = auth.uid()
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
        OR EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = procurement_entries.project_id 
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = procurement_entries.project_id
            AND p.created_by = auth.uid()
        )
    );
