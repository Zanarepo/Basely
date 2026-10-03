-- Add custom overrides for sprints and releases on organizations table

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS custom_max_sprints_limit INTEGER NULL,
  ADD COLUMN IF NOT EXISTS custom_max_releases_limit INTEGER NULL;
