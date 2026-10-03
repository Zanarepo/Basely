-- Migration: Allow Sponsors to view and update approval requests
-- Version: 20260824070000_allow_sponsor_approvals

-- Drop old policies
drop policy if exists "Users can view their own requests and admins/PMs can view all org requests" on public.approval_requests;
drop policy if exists "Admins and PMs can update requests to approve/reject" on public.approval_requests;

-- Recreate with Sponsor included
create policy "Users can view their own requests and admins/PMs/Sponsors can view all org requests"
    on public.approval_requests for select
    using (
        requested_by_user_id = auth.uid()
        or public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Sponsor'::public.user_role)
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
    );

create policy "Admins, PMs and Sponsors can update requests to approve/reject"
    on public.approval_requests for update
    using (
        public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Sponsor'::public.user_role)
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
    )
    with check (
        public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Sponsor'::public.user_role)
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
    );
