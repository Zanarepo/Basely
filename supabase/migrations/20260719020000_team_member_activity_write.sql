-- Migration: Allow Team Members to write activities & dependencies for WBS elements they own
-- This adds permissive RLS policies so Team Members can update timelines on their assigned cards.
-- PostgreSQL RLS: if ANY permissive policy passes, the operation is allowed.

-- 1. Activities: Allow Team Member INSERT when they own the WBS element
create policy "Team Member Insert activities"
  on public.activities for insert to authenticated
  with check (
    exists (
      select 1 from public.wbs_elements w
      where w.id = wbs_element_id
        and w.owner_id = auth.uid()
        and w.project_id = activities.project_id
    )
    and exists (
      select 1 from public.organization_members om
        join public.projects p on p.organization_id = om.organization_id
      where p.id = activities.project_id
        and om.user_id = auth.uid()
        and om.role = 'Team Member'
    )
  );

-- 2. Activities: Allow Team Member UPDATE when they own the WBS element
create policy "Team Member Update activities"
  on public.activities for update to authenticated
  using (
    exists (
      select 1 from public.wbs_elements w
      where w.id = wbs_element_id
        and w.owner_id = auth.uid()
        and w.project_id = activities.project_id
    )
    and exists (
      select 1 from public.organization_members om
        join public.projects p on p.organization_id = om.organization_id
      where p.id = activities.project_id
        and om.user_id = auth.uid()
        and om.role = 'Team Member'
    )
  )
  with check (
    exists (
      select 1 from public.wbs_elements w
      where w.id = wbs_element_id
        and w.owner_id = auth.uid()
        and w.project_id = activities.project_id
    )
    and exists (
      select 1 from public.organization_members om
        join public.projects p on p.organization_id = om.organization_id
      where p.id = activities.project_id
        and om.user_id = auth.uid()
        and om.role = 'Team Member'
    )
  );

-- 3. Dependencies: Allow Team Member INSERT when they own the predecessor's WBS element
create policy "Team Member Insert dependencies"
  on public.dependencies for insert to authenticated
  with check (
    exists (
      select 1 from public.activities a
        join public.wbs_elements w on w.id = a.wbs_element_id
      where a.id = successor_id
        and w.owner_id = auth.uid()
    )
  );

-- 4. Dependencies: Allow Team Member UPDATE when they own the successor's WBS element
create policy "Team Member Update dependencies"
  on public.dependencies for update to authenticated
  using (
    exists (
      select 1 from public.activities a
        join public.wbs_elements w on w.id = a.wbs_element_id
      where a.id = successor_id
        and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.activities a
        join public.wbs_elements w on w.id = a.wbs_element_id
      where a.id = successor_id
        and w.owner_id = auth.uid()
    )
  );

-- 5. Also allow Team Members to UPDATE their own WBS elements (for status changes, self-assignment)
create policy "Team Member Update own wbs_elements"
  on public.wbs_elements for update to authenticated
  using (
    owner_id = auth.uid()
    and exists (
      select 1 from public.organization_members om
        join public.projects p on p.organization_id = om.organization_id
      where p.id = wbs_elements.project_id
        and om.user_id = auth.uid()
        and om.role = 'Team Member'
    )
  )
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.organization_members om
        join public.projects p on p.organization_id = om.organization_id
      where p.id = wbs_elements.project_id
        and om.user_id = auth.uid()
        and om.role = 'Team Member'
    )
  );

-- 6. Allow Team Members to self-assign unassigned WBS elements
create policy "Team Member Self-assign unassigned wbs_elements"
  on public.wbs_elements for update to authenticated
  using (
    owner_id is null
    and exists (
      select 1 from public.organization_members om
        join public.projects p on p.organization_id = om.organization_id
      where p.id = wbs_elements.project_id
        and om.user_id = auth.uid()
        and om.role = 'Team Member'
    )
  )
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.organization_members om
        join public.projects p on p.organization_id = om.organization_id
      where p.id = wbs_elements.project_id
        and om.user_id = auth.uid()
        and om.role = 'Team Member'
    )
  );
