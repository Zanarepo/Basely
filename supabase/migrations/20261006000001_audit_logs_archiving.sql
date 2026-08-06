-- 1. Add Archiving Columns
ALTER TABLE public.backoffice_audit_logs
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 2. Create the pg_cron extension if it does not exist (usually requires superuser)
-- Note: Supabase enables this by default, but we should make sure the schema is created.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the deletion job
-- This will run every day at midnight (0 0 * * *)
-- It deletes rows where is_archived = true AND archived_at is older than 30 days
SELECT cron.schedule(
  'delete_old_audit_logs',
  '0 0 * * *',
  $$
  DELETE FROM public.backoffice_audit_logs
  WHERE is_archived = true
  AND archived_at < NOW() - INTERVAL '30 days';
  $$
);
