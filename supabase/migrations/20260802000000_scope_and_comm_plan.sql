-- 1. scope_statements table
CREATE TABLE IF NOT EXISTS public.scope_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    in_scope_summary TEXT,
    out_of_scope TEXT,
    assumptions TEXT,
    constraints TEXT,
    anchored_wbs_element_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id)
);

-- RLS for scope_statements
ALTER TABLE public.scope_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scope statements for their projects"
    ON public.scope_statements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = scope_statements.project_id
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = scope_statements.project_id 
            AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = scope_statements.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can edit scope statements for their projects"
    ON public.scope_statements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = scope_statements.project_id
            AND project_members.user_id = auth.uid()
            AND (project_members.can_edit_documents = true OR project_members.project_role_title = 'Project Manager')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = scope_statements.project_id 
            AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = scope_statements.project_id
            AND p.created_by = auth.uid()
        )
    );

-- 2. communication_plan_entries table
CREATE TABLE IF NOT EXISTS public.communication_plan_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    cadence TEXT,
    channel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for communication_plan_entries
ALTER TABLE public.communication_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view communication plan entries for their projects"
    ON public.communication_plan_entries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = communication_plan_entries.project_id
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = communication_plan_entries.project_id 
            AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = communication_plan_entries.project_id
            AND p.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can edit communication plan entries for their projects"
    ON public.communication_plan_entries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = communication_plan_entries.project_id
            AND project_members.user_id = auth.uid()
            AND (project_members.can_edit_documents = true OR project_members.project_role_title = 'Project Manager')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.organizations o ON p.organization_id = o.id
            WHERE p.id = communication_plan_entries.project_id 
            AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = communication_plan_entries.project_id
            AND p.created_by = auth.uid()
        )
    );

-- Add update triggers for updated_at
CREATE TRIGGER handle_updated_at_scope_statements
    BEFORE UPDATE ON public.scope_statements
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER handle_updated_at_communication_plan_entries
    BEFORE UPDATE ON public.communication_plan_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_updated_at();
