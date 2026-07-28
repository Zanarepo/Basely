-- Migration: Change Request Logs and Deliverable Sign-offs (Sprint 41)
-- Version: 20260805000000_change_requests_and_signoffs

-- 1. Create change_request_log_entries table
CREATE TABLE IF NOT EXISTS public.change_request_log_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('pending', 'approved', 'rejected', 'withdrawn')) DEFAULT 'pending',
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create deliverable_signoffs table
CREATE TABLE IF NOT EXISTS public.deliverable_signoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wbs_element_id UUID REFERENCES public.wbs_elements(id) ON DELETE CASCADE NOT NULL,
    signed_by_type TEXT NOT NULL CHECK (signed_by_type IN ('internal_user', 'external_stakeholder')),
    signed_by_reference TEXT NOT NULL, -- Either a name/email for external or user info for internal
    token TEXT UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    conditions_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.change_request_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_signoffs ENABLE ROW LEVEL SECURITY;

-- 4. Indices
CREATE INDEX IF NOT EXISTS idx_crl_project ON public.change_request_log_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_deliv_signoffs_wbs ON public.deliverable_signoffs(wbs_element_id);
CREATE INDEX IF NOT EXISTS idx_deliv_signoffs_token ON public.deliverable_signoffs(token) WHERE token IS NOT NULL;

-- 5. RLS Policies for Change Request Logs
-- Read access for project members
CREATE POLICY "Allow members to read change requests"
    ON public.change_request_log_entries FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );

-- Insert access for project PMs and Admins
CREATE POLICY "Allow PMs to insert change requests"
    ON public.change_request_log_entries FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM public.projects p
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
        )
    );

-- Update access for project PMs and Admins
CREATE POLICY "Allow PMs to update change requests"
    ON public.change_request_log_entries FOR UPDATE
    USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
        )
    );

-- Delete access for project PMs and Admins
CREATE POLICY "Allow PMs to delete change requests"
    ON public.change_request_log_entries FOR DELETE
    USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
        )
    );

-- 6. RLS Policies for Deliverable Signoffs
-- Read access for project members (via wbs_elements -> projects)
CREATE POLICY "Allow members to read deliverable signoffs"
    ON public.deliverable_signoffs FOR SELECT
    USING (
        wbs_element_id IN (
            SELECT w.id FROM public.wbs_elements w
            JOIN public.projects p ON w.project_id = p.id
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );

-- Insert access for PMs and Admins
CREATE POLICY "Allow PMs to insert deliverable signoffs"
    ON public.deliverable_signoffs FOR INSERT
    WITH CHECK (
        wbs_element_id IN (
            SELECT w.id FROM public.wbs_elements w
            JOIN public.projects p ON w.project_id = p.id
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
        )
    );

-- Update access for PMs and Admins (only allowed if not signed yet)
CREATE POLICY "Allow PMs to update unsigned deliverable signoffs"
    ON public.deliverable_signoffs FOR UPDATE
    USING (
        wbs_element_id IN (
            SELECT w.id FROM public.wbs_elements w
            JOIN public.projects p ON w.project_id = p.id
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
        )
    );

-- Delete access for PMs and Admins (only allowed if not signed yet)
CREATE POLICY "Allow PMs to delete unsigned deliverable signoffs"
    ON public.deliverable_signoffs FOR DELETE
    USING (
        wbs_element_id IN (
            SELECT w.id FROM public.wbs_elements w
            JOIN public.projects p ON w.project_id = p.id
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role)
        )
    );
