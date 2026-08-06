-- ============================================================================
-- Migration: Data Deletion & Right to be Forgotten (Sprint 49)
-- Description: Strict 30-day grace period data deletion with exception logic.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deletion_status') THEN
        CREATE TYPE public.deletion_status AS ENUM ('pending', 'cancelled', 'completed', 'failed');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    grace_period_ends_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    status public.deletion_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deletion_reqs_org ON public.deletion_requests(organization_id);
CREATE INDEX idx_deletion_reqs_status ON public.deletion_requests(status);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage deletion requests" ON public.deletion_requests
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = auth.uid() AND role = 'superadmin'));

-- Trigger for updated_at
CREATE TRIGGER set_deletion_requests_updated_at
    BEFORE UPDATE ON public.deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- The deletion execution function
CREATE OR REPLACE FUNCTION public.execute_organization_deletion(p_org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Retention Exception Logic: 
    -- We do NOT delete the organization_subscriptions (billing) and the organizations row itself (to anchor the billing).
    -- Instead, we anonymize the organization and aggressively delete all operational data.
    
    -- 1. Wipe Operational Data
    DELETE FROM public.projects WHERE organization_id = p_org_id;
    DELETE FROM public.support_tickets WHERE organization_id = p_org_id;
    DELETE FROM public.tenant_health_notes WHERE organization_id = p_org_id;
    DELETE FROM public.tenant_overrides_log WHERE organization_id = p_org_id;
    DELETE FROM public.account_assignments WHERE organization_id = p_org_id;
    DELETE FROM public.organization_members WHERE organization_id = p_org_id;
    
    -- (Note: ON DELETE CASCADE from projects handles wbs_elements, project_activity_logs, risk_issue_register, etc.)
    
    -- 2. Anonymize the organization record
    UPDATE public.organizations
    SET name = 'Deleted Organization ' || id::text,
        updated_at = NOW()
    WHERE id = p_org_id;
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$;


-- Scheduled job to process pending deletions
CREATE OR REPLACE FUNCTION public.process_pending_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
    v_success BOOLEAN;
BEGIN
    FOR r IN 
        SELECT id, organization_id 
        FROM public.deletion_requests 
        WHERE status = 'pending' 
        AND grace_period_ends_at <= NOW()
    LOOP
        -- Execute the wipe
        v_success := public.execute_organization_deletion(r.organization_id);
        
        IF v_success THEN
            UPDATE public.deletion_requests 
            SET status = 'completed', executed_at = NOW() 
            WHERE id = r.id;
        ELSE
            UPDATE public.deletion_requests 
            SET status = 'failed' 
            WHERE id = r.id;
        END IF;
    END LOOP;
END;
$$;

-- SELECT cron.schedule('process_deletions', '0 0 * * *', 'SELECT public.process_pending_deletions()');
