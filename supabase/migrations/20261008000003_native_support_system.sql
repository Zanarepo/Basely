-- ============================================================================
-- Migration: Consolidated Support System (Tickets & Messaging)
-- Description: Support tickets, SLA tracking, and threaded messaging
-- ============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT,
    status public.ticket_status NOT NULL DEFAULT 'open',
    priority public.ticket_priority NOT NULL DEFAULT 'low',
    
    -- SLA Tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    sla_breach_alerted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- External Integration
    provider TEXT,
    external_id TEXT,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON public.support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Staff can view all support tickets
DO $$ BEGIN
    CREATE POLICY "Staff can view all support tickets" ON public.support_tickets
        FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Staff can modify support tickets
DO $$ BEGIN
    CREATE POLICY "Staff can modify support tickets" ON public.support_tickets
        FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Organization members can view their own tickets
DO $$ BEGIN
    CREATE POLICY "Members can view org tickets" ON public.support_tickets
        FOR SELECT TO authenticated
        USING (EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = support_tickets.organization_id AND user_id = auth.uid()
        ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Organization members can create tickets
DO $$ BEGIN
    CREATE POLICY "Members can create org tickets" ON public.support_tickets
        FOR INSERT TO authenticated
        WITH CHECK (EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = support_tickets.organization_id AND user_id = auth.uid()
        ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger for updated_at on support_tickets
DO $$ BEGIN
    CREATE TRIGGER set_support_tickets_updated_at
        BEFORE UPDATE ON public.support_tickets
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- SLA breach function (creates the pg_cron dependency if used later)
CREATE OR REPLACE FUNCTION public.check_sla_breaches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT id, organization_id, subject, priority
        FROM public.support_tickets
        WHERE sla_breach_alerted = FALSE
        AND status IN ('open', 'in_progress')
        AND (
            (priority = 'urgent' AND (NOW() - created_at) > INTERVAL '2 hours' AND first_response_at IS NULL)
            OR
            (priority = 'high' AND (NOW() - created_at) > INTERVAL '4 hours' AND first_response_at IS NULL)
            OR
            (priority = 'medium' AND (NOW() - created_at) > INTERVAL '24 hours' AND first_response_at IS NULL)
        )
    LOOP
        -- Notify the organization account managers / superadmins
        PERFORM public.notify_backoffice_org(
            r.organization_id,
            'support_request'::public.backoffice_notification_type,
            'SLA Breach: ' || r.subject,
            'Ticket has breached its ' || r.priority || ' priority SLA threshold.'
        );

        -- Mark as alerted
        UPDATE public.support_tickets
        SET sla_breach_alerted = TRUE,
            updated_at = NOW()
        WHERE id = r.id;
    END LOOP;
END;
$func$;

-- 3. Create support_ticket_messages table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created ON public.support_ticket_messages(created_at);

-- Enable RLS for messages
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Staff can view all messages
DO $$ BEGIN
    CREATE POLICY "Staff can view all messages" ON public.support_ticket_messages
        FOR SELECT TO authenticated
        USING (EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Staff can insert messages
DO $$ BEGIN
    CREATE POLICY "Staff can insert messages" ON public.support_ticket_messages
        FOR INSERT TO authenticated
        WITH CHECK (EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Members can view messages for their org's tickets
DO $$ BEGIN
    CREATE POLICY "Members can view org ticket messages" ON public.support_ticket_messages
        FOR SELECT TO authenticated
        USING (EXISTS (
            SELECT 1 FROM public.support_tickets st
            JOIN public.organization_members om ON om.organization_id = st.organization_id
            WHERE st.id = support_ticket_messages.ticket_id AND om.user_id = auth.uid()
        ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Members can insert messages for their org's tickets
DO $$ BEGIN
    CREATE POLICY "Members can insert org ticket messages" ON public.support_ticket_messages
        FOR INSERT TO authenticated
        WITH CHECK (EXISTS (
            SELECT 1 FROM public.support_tickets st
            JOIN public.organization_members om ON om.organization_id = st.organization_id
            WHERE st.id = support_ticket_messages.ticket_id AND om.user_id = auth.uid()
        ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Trigger to update support_tickets.updated_at when a new message is added
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    UPDATE public.support_tickets
    SET updated_at = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$func$;

DO $$ BEGIN
    CREATE TRIGGER update_ticket_timestamp_after_message
        AFTER INSERT ON public.support_ticket_messages
        FOR EACH ROW
        EXECUTE FUNCTION update_ticket_timestamp_on_message();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Schedule SLA check to run every 5 minutes
SELECT cron.schedule(
    'support_check_sla_breaches',
    '*/5 * * * *',
    'SELECT public.check_sla_breaches()'
);
