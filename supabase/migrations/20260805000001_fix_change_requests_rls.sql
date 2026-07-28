-- Update INSERT policy to allow Team Members to log change requests
DROP POLICY IF EXISTS "Allow PMs to insert change requests" ON public.change_request_log_entries;

CREATE POLICY "Allow PMs and Team Members to insert change requests"
    ON public.change_request_log_entries FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM public.projects p
            WHERE p.organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
            AND public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );
