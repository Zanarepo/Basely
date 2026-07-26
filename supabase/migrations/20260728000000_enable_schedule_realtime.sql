-- Migration: Enable Realtime for Schedule Tables
-- Adds activities, dependencies, and wbs_elements to the supabase_realtime publication

BEGIN;

-- Attempt to add tables to realtime (catch exceptions if they are already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dependencies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wbs_elements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
