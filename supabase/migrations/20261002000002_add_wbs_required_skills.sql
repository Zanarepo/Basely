-- Add required_skills array to wbs_elements

ALTER TABLE public.wbs_elements
  ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';
