-- Add policy to allow requesters to delete their own approval requests
create policy "Users can delete their own requests and admins can delete any"
    on public.approval_requests for delete
    using (
        requested_by_user_id = auth.uid()
        or public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) = 'Admin'::public.user_role
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
    );
