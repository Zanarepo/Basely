-- Sprint 50: Abuse Flags and Detection

-- 1. Create abuse_flags table
CREATE TABLE IF NOT EXISTS public.abuse_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL, -- e.g., 'velocity_signup', 'payment_cycling', 'api_abuse'
    detail JSONB NOT NULL DEFAULT '{}'::jsonb,
    flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    review_outcome TEXT -- e.g., 'dismissed', 'banned', 'monitored'
);

CREATE INDEX idx_abuse_flags_org ON public.abuse_flags(organization_id);
CREATE INDEX idx_abuse_flags_unreviewed ON public.abuse_flags(flagged_at) WHERE reviewed_at IS NULL;

-- Enable RLS
ALTER TABLE public.abuse_flags ENABLE ROW LEVEL SECURITY;

-- Backoffice superadmins can read all abuse flags
CREATE POLICY "Superadmins can manage abuse flags" 
ON public.abuse_flags
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.internal_staff 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('superadmin', 'support_admin')
    )
);

-- 2. Mock functions for simulated abuse detection
-- These are intended to be run by pg_cron or triggered during testing

-- Detect Signup Velocity (e.g., > 10 orgs created in 1 hour by same IP or user pattern - simplified for simulation)
CREATE OR REPLACE FUNCTION public.detect_signup_velocity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For simulation purposes, we will flag any organization created in the last 24h 
    -- if there's a specific pattern (here, we just randomly flag 5% of new orgs if they don't have a flag)
    INSERT INTO public.abuse_flags (organization_id, flag_type, detail)
    SELECT id, 'velocity_signup', '{"reason": "Simulated high velocity signup detected."}'::jsonb
    FROM public.organizations
    WHERE created_at > (NOW() - INTERVAL '24 hours')
    AND random() < 0.05
    AND id NOT IN (SELECT organization_id FROM public.abuse_flags WHERE flag_type = 'velocity_signup');
END;
$$;

-- Detect Payment Cycling (e.g., multiple failed payments)
CREATE OR REPLACE FUNCTION public.detect_payment_cycling()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simulated payment cycling detection
    INSERT INTO public.abuse_flags (organization_id, flag_type, detail)
    SELECT id, 'payment_cycling', '{"reason": "Simulated multiple failed payment attempts."}'::jsonb
    FROM public.organizations
    WHERE created_at > (NOW() - INTERVAL '30 days')
    AND random() < 0.02
    AND id NOT IN (SELECT organization_id FROM public.abuse_flags WHERE flag_type = 'payment_cycling');
END;
$$;

-- Schedule the detection jobs
SELECT cron.schedule(
    'detect_signup_velocity_job',
    '*/15 * * * *',
    'SELECT public.detect_signup_velocity()'
);

SELECT cron.schedule(
    'detect_payment_cycling_job',
    '0 * * * *',
    'SELECT public.detect_payment_cycling()'
);
