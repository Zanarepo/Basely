-- Migration: Backfill existing linked stakeholders into organization_members
-- Version: 20260824060001_backfill_stakeholders_to_org

insert into public.organization_members (organization_id, user_id, role)
select distinct p.organization_id, s.linked_user_id, 
  (case when s.role_title ilike '%sponsor%' then 'Sponsor' else 'Sponsor' end)::public.user_role
from public.stakeholders s
join public.projects p on p.id = s.project_id
where s.linked_user_id is not null
  and not exists (
      select 1 from public.organization_members om
      where om.organization_id = p.organization_id and om.user_id = s.linked_user_id
  );
