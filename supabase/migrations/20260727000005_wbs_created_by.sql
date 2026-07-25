-- Migration: wbs_created_by and strict Team Member RACI policies
-- Version: 20260727000005_wbs_created_by

-- 1. Add created_by to wbs_elements to track who made a task
ALTER TABLE public.wbs_elements 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Automatically set created_by to auth.uid() if not provided (useful for direct client inserts)
ALTER TABLE public.wbs_elements 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 2. Update the WBS elements delete policy to ensure Team Members can ONLY delete if they created it
DROP POLICY IF EXISTS "Team Members can delete their own WBS elements" ON public.wbs_elements;
CREATE POLICY "Team Members can delete their own WBS elements" ON public.wbs_elements
FOR DELETE USING (
  -- If you're an Admin/PM/Owner, the global write policy handles this.
  -- This policy specifically grants deletion rights to Team Members who created the task.
  created_by = auth.uid()
);

-- 3. Add a policy to prevent Team Members from deleting or updating RACI assignments of OTHER people
-- (We'll enforce this by overriding the RACI policies to only allow Admins/PMs/Project Owners to mutate RACI)

DROP POLICY IF EXISTS "Insert raci_assignments" ON public.raci_assignments;
CREATE POLICY "Insert raci_assignments" ON public.raci_assignments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = raci_assignments.project_id
    AND (
      public.is_workspace_owner(p.organization_id, auth.uid()) OR
      public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin', 'PM') OR
      p.created_by = auth.uid() OR
      -- Allow Team Members to insert only if they are assigning themselves
      (
        public.can_user_edit_schedule(p.id, auth.uid()) AND
        raci_assignments.stakeholder_id IN (
          SELECT id FROM public.stakeholders WHERE linked_user_id = auth.uid()
        )
      )
    )
  )
);

DROP POLICY IF EXISTS "Update raci_assignments" ON public.raci_assignments;
CREATE POLICY "Update raci_assignments" ON public.raci_assignments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = raci_assignments.project_id
    AND (
      public.is_workspace_owner(p.organization_id, auth.uid()) OR
      public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin', 'PM') OR
      p.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Delete raci_assignments" ON public.raci_assignments;
CREATE POLICY "Delete raci_assignments" ON public.raci_assignments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = raci_assignments.project_id
    AND (
      public.is_workspace_owner(p.organization_id, auth.uid()) OR
      public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin', 'PM') OR
      p.created_by = auth.uid() OR
      -- Allow Team Members to delete their own assignments
      (
        public.can_user_edit_schedule(p.id, auth.uid()) AND
        raci_assignments.stakeholder_id IN (
          SELECT id FROM public.stakeholders WHERE linked_user_id = auth.uid()
        )
      )
    )
  )
);
