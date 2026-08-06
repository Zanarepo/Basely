-- Add is_staff_reply to support_ticket_messages to distinguish admin vs tenant replies
ALTER TABLE public.support_ticket_messages ADD COLUMN IF NOT EXISTS is_staff_reply BOOLEAN NOT NULL DEFAULT FALSE;

-- Ensure table is in supabase_realtime publication
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
EXCEPTION WHEN duplicate_object THEN null; WHEN others THEN null; END $$;

-- Set replica identity for proper realtime filtering
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;
