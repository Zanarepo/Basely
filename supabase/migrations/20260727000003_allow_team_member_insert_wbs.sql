-- Migration: Allow Team Members with schedule toggle to CREATE wbs elements
-- Version: 20260727000003_allow_team_member_insert_wbs

-- We redefine the INSERT policy for wbs_elements to use `can_user_edit_schedule`
-- This allows anyone with the granular schedule toggle (including Team Members) to create tasks.
-- The UPDATE and DELETE policies remain strictly tied to `can_user_write_project_wbs` (Admins/PMs only)
-- and the RACI assignment policies (Team Members can update their assigned tasks).

DROP POLICY IF EXISTS "Insert WBS elements" ON public.wbs_elements;

CREATE POLICY "Insert WBS elements" 
ON public.wbs_elements FOR INSERT 
WITH CHECK (public.can_user_edit_schedule(project_id, auth.uid()));
