-- Migration: Change wbs_elements.status from enum to text
-- This allows users to define custom status columns dynamically

-- 1. Alter the column type from enum to text, casting existing values
ALTER TABLE public.wbs_elements
  ALTER COLUMN status SET DATA TYPE text
  USING status::text;

-- 2. Set a sensible default
ALTER TABLE public.wbs_elements
  ALTER COLUMN status SET DEFAULT 'Not Started';

-- 3. Drop the old enum type since it's no longer referenced
DROP TYPE IF EXISTS public.wbs_element_status;
