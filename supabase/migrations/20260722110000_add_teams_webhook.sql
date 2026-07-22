-- Add teams_webhook_url to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS teams_webhook_url TEXT;
