-- Add Agile fields to wbs_elements
ALTER TABLE public.wbs_elements
ADD COLUMN IF NOT EXISTS user_stories text,
ADD COLUMN IF NOT EXISTS edge_cases text,
ADD COLUMN IF NOT EXISTS priority text;



