-- ============================================================================
-- Migration: Support Tickets & SLA (Sprint 49)
-- Description: Ticket tracking with pg_cron for SLA breaches.
-- ============================================================================

CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

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

CREATE INDEX idx_support_tickets_org ON public.support_tickets(organization_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Staff can view all support tickets
CREATE POLICY "Staff can view all support tickets" ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()
        )
    );

-- Staff can insert/update tickets
CREATE POLICY "Staff can modify support tickets" ON public.support_tickets
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid()
        )
    );

-- Organization members can view their own tickets
CREATE POLICY "Members can view org tickets" ON public.support_tickets
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = support_tickets.organization_id
            AND user_id = auth.uid()
        )
    );

-- Organization members can create tickets
CREATE POLICY "Members can create org tickets" ON public.support_tickets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = support_tickets.organization_id
            AND user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER set_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();


-- Add SLA monitoring
CREATE OR REPLACE FUNCTION public.check_sla_breaches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
