-- Migration to add AI usage tracking table
CREATE TABLE IF NOT EXISTS organization_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  billing_cycle_start timestamptz NOT NULL DEFAULT now(),
  ai_generations_count int NOT NULL DEFAULT 0,
  ai_basic_actions_count int NOT NULL DEFAULT 0,
  ai_meetings_count int NOT NULL DEFAULT 0,
  ai_pipeline_runs_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Turn on RLS
ALTER TABLE organization_ai_usage ENABLE ROW LEVEL SECURITY;

-- Only members can view their org's usage
CREATE POLICY "Members can view their org's ai usage" ON organization_ai_usage
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Create an trigger to automatically add this row when an organization is created
CREATE OR REPLACE FUNCTION public.handle_new_organization_ai_usage() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_ai_usage (organization_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created_ai_usage
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_organization_ai_usage();

-- Backfill existing organizations
INSERT INTO public.organization_ai_usage (organization_id)
SELECT id FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;
