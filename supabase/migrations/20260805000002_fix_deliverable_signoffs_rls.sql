-- Update INSERT policy to allow Team Members to request deliverable signoffs
DROP POLICY IF EXISTS "Allow PMs to insert deliverable signoffs" ON public.deliverable_signoffs;

CREATE POLICY "Allow PMs and Team Members to insert deliverable signoffs"
    ON public.deliverable_signoffs FOR INSERT
    WITH CHECK (
        wbs_element_id IN (
            SELECT w.id FROM public.wbs_elements w
            JOIN public.projects p ON w.project_id = p.id
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );
