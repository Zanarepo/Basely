-- Sprint 27: Public API Keys Infrastructure

CREATE TYPE public.api_key_scope AS ENUM (
    'read_only',
    'read_write'
);

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    scope public.api_key_scope NOT NULL DEFAULT 'read_only',
    entity_scope TEXT[] NOT NULL DEFAULT '{}',
    created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ
);

-- Indexes for fast lookup
CREATE INDEX idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- API Keys RLS Policies: Only Organization Admins can view/manage
-- Note: we use get_user_role_in_org(org_uuid, user_uuid) which was created in init schema

CREATE POLICY "Org Admins can view api keys" ON public.api_keys
    FOR SELECT USING (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'
    );

CREATE POLICY "Org Admins can insert api keys" ON public.api_keys
    FOR INSERT WITH CHECK (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'
    );

CREATE POLICY "Org Admins can update api keys" ON public.api_keys
    FOR UPDATE USING (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_api_keys
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_updated_at();

-- End of API Keys Schema
