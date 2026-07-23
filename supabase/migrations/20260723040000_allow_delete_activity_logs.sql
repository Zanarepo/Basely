-- Allow deletion of activity logs by Admin and Project Manager roles

CREATE POLICY "Users can delete project activity logs"
  ON public.project_activity_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_activity_logs.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('Admin', 'PM')
    )
  );
