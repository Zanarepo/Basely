-- Migration: Create SSO Configurations table

-- Create SSO Protocol Enum
CREATE TYPE public.sso_protocol AS ENUM ('saml', 'oauth');

-- Create SSO Configurations Table
CREATE TABLE IF NOT EXISTS public.sso_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    protocol public.sso_protocol NOT NULL,
    idp_metadata JSONB,
    certificate TEXT,
    attribute_mapping JSONB DEFAULT '{}'::jsonb,
    enforced BOOLEAN NOT NULL DEFAULT false,
    break_glass_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Admins to manage their organization's SSO configuration
CREATE POLICY "Allow organization Admins to manage SSO configurations"
    ON public.sso_configurations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
            AND organization_id = sso_configurations.organization_id
            AND role = 'Admin'::public.user_role
        )
    );

-- Policy: Allow everyone to read SSO configurations for their organization
CREATE POLICY "Allow all members to read SSO configurations"
    ON public.sso_configurations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
            AND organization_id = sso_configurations.organization_id
        )
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sso_configurations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sso_configurations TO authenticated;

-- RPC to securely check if a user's email requires SSO login (used by login page before auth)
DROP FUNCTION IF EXISTS public.check_sso_status(TEXT);
CREATE OR REPLACE FUNCTION public.check_sso_status(p_email TEXT)
RETURNS TABLE (
    enforced BOOLEAN,
    organization_id UUID,
    is_break_glass BOOLEAN,
    idp_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.enforced, 
        s.organization_id,
        (s.break_glass_admin_id = p.id) as is_break_glass,
        (s.idp_metadata->>'url')::TEXT as idp_url
    FROM public.sso_configurations s
    JOIN public.organization_members om ON s.organization_id = om.organization_id
    JOIN public.profiles p ON om.user_id = p.id
    WHERE p.email = p_email
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.check_sso_status(TEXT) TO anon, authenticated;
