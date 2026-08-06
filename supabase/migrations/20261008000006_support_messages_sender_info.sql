-- Add sender_name and sender_role to support_ticket_messages for better customer relationships & account manager transparency
ALTER TABLE public.support_ticket_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.support_ticket_messages ADD COLUMN IF NOT EXISTS sender_role TEXT;
