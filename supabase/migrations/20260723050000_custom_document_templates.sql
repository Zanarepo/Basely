CREATE TABLE IF NOT EXISTS public.custom_document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  section_definitions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.custom_document_templates ENABLE ROW LEVEL SECURITY;

-- Organization Admins can manage custom templates
CREATE POLICY "Admins can manage custom templates"
  ON public.custom_document_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = custom_document_templates.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = custom_document_templates.organization_id
      AND om.user_id = auth.uid()
      AND om.role = 'Admin'
    )
  );

-- All Organization members can read custom templates
CREATE POLICY "Members can view custom templates"
  ON public.custom_document_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = custom_document_templates.organization_id
      AND om.user_id = auth.uid()
    )
  );
