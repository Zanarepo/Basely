-- Migration: Add Sponsor Role and Update RLS policies
-- Version: 20260824020000_add_sponsor_role

-- 1. Add Sponsor to user_role enum
alter type public.user_role add value if not exists 'Sponsor';
commit;

-- 2. Update projects RLS to allow Sponsors to view projects where they are a stakeholder
drop policy if exists "Select projects" on public.projects;

create policy "Select projects"
  on public.projects for select
  using (
    -- Workspace Owner
    public.is_workspace_owner(organization_id, auth.uid())
    -- Admin role
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    -- Creator (always sees own project, even if archived)
    or (created_by = auth.uid())
    -- Active project + PM role
    or (not is_archived and public.get_user_role_in_org(organization_id, auth.uid()) = 'PM'::public.user_role)
    -- Active project + Project Member
    or (
      not is_archived 
      and exists (
        select 1 from public.project_members
        where project_id = id and user_id = auth.uid()
      )
    )
    -- Active project + Sponsor linked in stakeholders
    or (
      not is_archived
      and public.get_user_role_in_org(organization_id, auth.uid()) = 'Sponsor'::public.user_role
      and exists (
        select 1 from public.stakeholders
        where project_id = id and linked_user_id = auth.uid()
      )
    )
  );

-- 3. Update approval_requests RLS to allow Sponsors to view/approve requests tied to their email
drop policy if exists "Users can view their own requests and admins/PMs can view all org requests" on public.approval_requests;
drop policy if exists "Admins and PMs can update requests to approve/reject" on public.approval_requests;

create policy "Users can view their own requests, admins/PMs can view all, and Sponsors can view assigned"
    on public.approval_requests for select
    using (
        requested_by_user_id = auth.uid()
        or public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
        or (
            public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) = 'Sponsor'::public.user_role
            and payload ? 'sponsor_emails'
            and (select email from public.profiles where id = auth.uid()) in (select jsonb_array_elements_text(payload->'sponsor_emails'))
        )
    );

create policy "Admins, PMs, and assigned Sponsors can update requests to approve/reject"
    on public.approval_requests for update
    using (
        public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
        or (
            public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) = 'Sponsor'::public.user_role
            and payload ? 'sponsor_emails'
            and (select email from public.profiles where id = auth.uid()) in (select jsonb_array_elements_text(payload->'sponsor_emails'))
        )
    )
    with check (
        public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
        or (
            public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) = 'Sponsor'::public.user_role
            and payload ? 'sponsor_emails'
            and (select email from public.profiles where id = auth.uid()) in (select jsonb_array_elements_text(payload->'sponsor_emails'))
        )
    );

-- 4. Create trigger to sync stakeholders to project_members
create or replace function public.sync_stakeholder_to_project_member()
returns trigger as $$
begin
  if new.linked_user_id is not null then
    insert into public.project_members (project_id, user_id)
    values (new.project_id, new.linked_user_id)
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists stakeholder_sync_member on public.stakeholders;
create trigger stakeholder_sync_member
after insert or update of linked_user_id on public.stakeholders
for each row
execute function public.sync_stakeholder_to_project_member();
