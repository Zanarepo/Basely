-- Add google_chat_webhook_url to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS google_chat_webhook_url TEXT;
