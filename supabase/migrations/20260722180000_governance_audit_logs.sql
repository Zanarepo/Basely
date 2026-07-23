CREATE TYPE public.governance_event_type AS ENUM (
  'approval_decision',
  'permission_change',
  'sso_config_change'
);

CREATE TABLE public.governance_audit_log_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type public.governance_event_type NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT governance_audit_log_entries_pkey PRIMARY KEY (id)
);

-- Index for querying by organization and event type
CREATE INDEX idx_gov_audit_org_event ON public.governance_audit_log_entries (organization_id, event_type);
CREATE INDEX idx_gov_audit_org_date ON public.governance_audit_log_entries (organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.governance_audit_log_entries ENABLE ROW LEVEL SECURITY;

-- 1. Immutability guarantees (Compliance Grade)
-- Revoke UPDATE and DELETE from all standard roles, including service_role
REVOKE UPDATE, DELETE ON public.governance_audit_log_entries FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.governance_audit_log_entries FROM authenticated;
REVOKE UPDATE, DELETE ON public.governance_audit_log_entries FROM service_role;

-- 2. RLS Policies
-- Allow insert from authenticated (application layer)
CREATE POLICY "Enable insert for authenticated users" 
ON public.governance_audit_log_entries 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow select ONLY for organization Admins
CREATE POLICY "Admins can view governance audit logs"
ON public.governance_audit_log_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = governance_audit_log_entries.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'Admin'
  )
);
