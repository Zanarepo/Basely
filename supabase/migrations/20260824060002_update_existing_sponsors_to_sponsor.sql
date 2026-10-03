-- Migration: Update existing viewers that should be sponsors
-- Version: 20260824060002_update_existing_sponsors_to_sponsor

update public.organization_members
set role = 'Sponsor'::public.user_role
where role = 'Viewer'::public.user_role
and user_id in (
    select linked_user_id 
    from public.stakeholders 
    where linked_user_id is not null
);
