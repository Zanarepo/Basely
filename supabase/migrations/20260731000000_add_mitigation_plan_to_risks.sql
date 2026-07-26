-- Add mitigation_plan column to risks table
ALTER TABLE public.risks ADD COLUMN IF NOT EXISTS mitigation_plan text;
