-- Migration: Allow Team Members to assign themselves Responsible and move their tasks

-- Policy 1: Allow Team Members to insert themselves as "Responsible" on unassigned tasks.
create policy "Team Members can assign themselves Responsible" on public.raci_assignments
for insert to authenticated
with check (
  role_type = 'Responsible' 
  and public.get_user_role_in_org((select p.organization_id from public.projects p where p.id = raci_assignments.project_id), auth.uid()) = 'Team Member'
  and stakeholder_id in (select s.id from public.stakeholders s where s.linked_user_id = auth.uid())
  and not exists (
    select 1 from public.raci_assignments r 
    where r.wbs_element_id = raci_assignments.wbs_element_id 
      and r.role_type = 'Responsible'
  )
);

-- Policy 2: Allow Team Members to delete their own "Responsible" assignment (optional, if they made a mistake)
create policy "Team Members can unassign themselves" on public.raci_assignments
for delete to authenticated
using (
  role_type = 'Responsible'
  and public.get_user_role_in_org((select p.organization_id from public.projects p where p.id = raci_assignments.project_id), auth.uid()) = 'Team Member'
  and stakeholder_id in (select s.id from public.stakeholders s where s.linked_user_id = auth.uid())
);

-- Policy 3: Allow Team Members to update WBS elements if they are assigned as "Responsible"
-- This enables drag and drop (updating status and parent_id)
create policy "Team Members can update their own WBS elements" on public.wbs_elements
for update to authenticated
using (
  public.get_user_role_in_org((select p.organization_id from public.projects p where p.id = wbs_elements.project_id), auth.uid()) = 'Team Member'
  and exists (
    select 1 from public.raci_assignments r
    join public.stakeholders s on s.id = r.stakeholder_id
    where r.wbs_element_id = wbs_elements.id
      and r.role_type = 'Responsible'
      and s.linked_user_id = auth.uid()
  )
)
with check (
  public.get_user_role_in_org((select p.organization_id from public.projects p where p.id = wbs_elements.project_id), auth.uid()) = 'Team Member'
  and exists (
    select 1 from public.raci_assignments r
    join public.stakeholders s on s.id = r.stakeholder_id
    where r.wbs_element_id = wbs_elements.id
      and r.role_type = 'Responsible'
      and s.linked_user_id = auth.uid()
  )
);
