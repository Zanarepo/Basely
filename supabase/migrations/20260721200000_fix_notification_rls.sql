-- Migration: Fix Notification RLS

BEGIN;

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;

-- Allow authenticated users to insert notifications (necessary for PMs/Team Members sending mentions)
CREATE POLICY "Allow authenticated to insert notifications" 
    ON public.notifications FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow service role to insert notifications
CREATE POLICY "Allow service role to insert notifications" 
    ON public.notifications FOR INSERT 
    TO service_role 
    WITH CHECK (true);

COMMIT;
