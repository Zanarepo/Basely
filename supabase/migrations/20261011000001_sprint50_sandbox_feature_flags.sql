-- Sprint 50: Sandbox Organizations & Internal Feature Flags

-- 1. Add Sandbox flag to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT false;

-- 2. Create Internal Feature Flags Table
CREATE TABLE IF NOT EXISTS public.internal_feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key TEXT UNIQUE NOT NULL,
    description TEXT,
    enabled_organization_ids UUID[] DEFAULT '{}'::uuid[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.internal_feature_flags ENABLE ROW LEVEL SECURITY;

-- Backoffice superadmins can read/write feature flags
CREATE POLICY "Superadmins can manage internal feature flags" 
ON public.internal_feature_flags
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.internal_staff 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('superadmin', 'support_admin')
    )
);

-- Note: Analytics updates to exclude sandbox orgs will be applied directly to the 
-- functions calculating MRR/ARR, typically by adding `AND (SELECT is_sandbox FROM organizations WHERE id = organization_id) = false`
-- We will update `getChurnRiskScores` and analytics queries in the codebase to filter out `is_sandbox`.
