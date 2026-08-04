-- Migration: Sprint 28 ERP/Accounting Connector Integration
-- Version: 20260930000000_sprint28_erp_connector

-- 1. Add 'erp_sync_failure' to notification trigger types
ALTER TYPE public.notification_trigger_type ADD VALUE IF NOT EXISTS 'erp_sync_failure';

-- 2. Add idempotency support to actual_costs table (Section 5 & Task 3.3)
ALTER TABLE public.actual_costs ADD COLUMN IF NOT EXISTS external_record_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS actual_costs_external_record_id_idx ON public.actual_costs(external_record_id) WHERE external_record_id IS NOT NULL;

-- 3. Create Connector Configuration Schema (Task 1.1)
CREATE TABLE IF NOT EXISTS public.erp_connector_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connector_type TEXT NOT NULL DEFAULT 'quickbooks' CHECK (connector_type IN ('quickbooks', 'netsuite', 'xero', 'sap')),
  account_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT false,
  auto_sync BOOLEAN NOT NULL DEFAULT false,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('disconnected', 'connected', 'error')),
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failure', 'partial_failure')),
  auth_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS erp_config_org_idx ON public.erp_connector_configurations(organization_id);

-- 4. Create Sync Logs Schema for Diagnostic Dashboard (Task 4.1 & Section 3.4)
CREATE TABLE IF NOT EXISTS public.erp_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  configuration_id UUID NOT NULL REFERENCES public.erp_connector_configurations(id) ON DELETE CASCADE,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failure', 'partial_failure')),
  total_records INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS erp_sync_logs_config_idx ON public.erp_sync_logs(configuration_id);
CREATE INDEX IF NOT EXISTS erp_sync_logs_org_idx ON public.erp_sync_logs(organization_id);
CREATE INDEX IF NOT EXISTS erp_sync_logs_completed_at_idx ON public.erp_sync_logs(completed_at DESC);

-- 5. Row Level Security Policies (Task 1.2: Restrict to Organization Admin role)
ALTER TABLE public.erp_connector_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sync_logs ENABLE ROW LEVEL SECURITY;

-- erp_connector_configurations RLS
CREATE POLICY "Org Admins can view erp configurations" ON public.erp_connector_configurations
  FOR SELECT USING (
    public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
  );

CREATE POLICY "Org Admins can insert erp configurations" ON public.erp_connector_configurations
  FOR INSERT WITH CHECK (
    public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
  );

CREATE POLICY "Org Admins can update erp configurations" ON public.erp_connector_configurations
  FOR UPDATE USING (
    public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
  );

CREATE POLICY "Org Admins can delete erp configurations" ON public.erp_connector_configurations
  FOR DELETE USING (
    public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
  );

-- erp_sync_logs RLS
CREATE POLICY "Org Admins can view erp sync logs" ON public.erp_sync_logs
  FOR SELECT USING (
    public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
  );

CREATE POLICY "Org Admins can insert erp sync logs" ON public.erp_sync_logs
  FOR INSERT WITH CHECK (
    public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
  );

CREATE POLICY "Org Admins can delete erp sync logs" ON public.erp_sync_logs
  FOR DELETE USING (
    public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
  );

-- 6. Trigger for updated_at
CREATE OR REPLACE TRIGGER handle_updated_at_erp_config
  BEFORE UPDATE ON public.erp_connector_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();
