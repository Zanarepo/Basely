-- Add story_points to wbs_elements to support Predictive Sprint & Schedule Planning
ALTER TABLE public.wbs_elements
ADD COLUMN IF NOT EXISTS story_points NUMERIC(5,2);
