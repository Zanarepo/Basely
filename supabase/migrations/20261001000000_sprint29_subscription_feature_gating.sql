-- ============================================================================
-- Migration: Sprint 29 Back Office — Subscription & Feature-Gating Engine
-- Description: Creates tier definition tables, feature mapping, usage limits,
-- organization subscriptions with automatic 14-day Enterprise trials, and
-- downgrade lock columns on projects.
-- ============================================================================

-- 1. SUBSCRIPTION TIERS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id TEXT PRIMARY KEY, -- 'free', 'premium', 'enterprise'
  name TEXT NOT NULL,
  price_per_seat NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly' NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TIER FEATURE MAP TABLE
CREATE TABLE IF NOT EXISTS public.tier_feature_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id TEXT REFERENCES public.subscription_tiers(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  module TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT unique_tier_feature UNIQUE (tier_id, feature_key)
);

-- 3. TIER USAGE LIMITS TABLE
CREATE TABLE IF NOT EXISTS public.tier_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id TEXT REFERENCES public.subscription_tiers(id) ON DELETE CASCADE NOT NULL,
  limit_key TEXT NOT NULL, -- 'max_seats', 'max_active_projects'
  max_value INTEGER NOT NULL, -- -1 represents unlimited
  CONSTRAINT unique_tier_limit UNIQUE (tier_id, limit_key)
);

-- 4. ORGANIZATION SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier_id TEXT REFERENCES public.subscription_tiers(id) ON DELETE SET NULL NOT NULL DEFAULT 'free',
  seat_count INTEGER DEFAULT 1 NOT NULL,
  status TEXT DEFAULT 'trialing' NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  trial_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '14 days') NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '14 days') NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ADD DOWNGRADE LOCK COLUMNS TO PROJECTS
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_reason TEXT NULL;

-- 6. SEED SUBSCRIPTION TIERS
INSERT INTO public.subscription_tiers (id, name, price_per_seat, billing_cycle, description)
VALUES 
  ('free', 'Free', 0.00, 'monthly', 'Core workspaces & basic project planning.'),
  ('premium', 'Premium', 25.00, 'monthly', 'Complete delivery mechanics, documentation, collaboration, & product management.'),
  ('enterprise', 'Enterprise', 65.00, 'monthly', 'Full governance, SSO, advanced RBAC, API integrations, & ERP connectors.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_per_seat = EXCLUDED.price_per_seat,
  description = EXCLUDED.description;

-- 7. SEED USAGE LIMITS
INSERT INTO public.tier_usage_limits (tier_id, limit_key, max_value)
VALUES
  ('free', 'max_seats', 3),
  ('free', 'max_active_projects', 2),
  ('free', 'max_workspaces', 1),
  ('premium', 'max_seats', -1),
  ('premium', 'max_active_projects', -1),
  ('premium', 'max_workspaces', -1),
  ('enterprise', 'max_seats', -1),
  ('enterprise', 'max_active_projects', -1),
  ('enterprise', 'max_workspaces', -1)
ON CONFLICT (tier_id, limit_key) DO UPDATE SET
  max_value = EXCLUDED.max_value;

-- 8. SEED TIER FEATURE MAPPINGS (24 definitive features)
INSERT INTO public.tier_feature_map (tier_id, feature_key, display_name, module, enabled)
VALUES
  -- FREE TIER (Foundation + Basic Planning only)
  ('free', 'foundation.workspace', 'Core Workspaces & Organization', 'Phase 1: Foundation', true),
  ('free', 'planning.wbs', 'WBS & Basic Gantt Schedule', 'Phase 2: Planning Core', true),
  ('free', 'cost.evm_engine', 'Earned Value Management (EVM)', 'Phase 3: Cost Core', false),
  ('free', 'cost.resource_rates', 'Advanced Resource Rate Config', 'Phase 3: Cost Core', false),
  ('free', 'cost.actuals_tracking', 'Actual Cost Logging & CSV Import', 'Phase 3: Cost Core', false),
  ('free', 'accountability.raci', 'RACI Matrix Generator', 'Phase 4: Accountability', false),
  ('free', 'accountability.risks', 'Risk & Issue Register', 'Phase 4: Accountability', false),
  ('free', 'documentation.engine', 'Live Document Engine & Charters', 'Phase 5: Documentation', false),
  ('free', 'documentation.status_reports', 'Automated Status Reports', 'Phase 5: Documentation', false),
  ('free', 'documentation.custom_templates', 'Custom Document Templates & Exports', 'Phase 5: Documentation', false),
  ('free', 'collaboration.realtime', 'Realtime Comments, Replies & Presence', 'Phase 6: Collaboration', false),
  ('free', 'collaboration.notifications', 'In-App & Email Notifications', 'Phase 6: Collaboration', false),
  ('free', 'reporting.analytics', 'Advanced Project Activity Logs & Charts', 'Phase 7: Reporting', false),
  ('free', 'product.roadmap_gtm', 'Product Roadmap & Go-To-Market Plans', 'Sprint 52: Product', false),
  ('free', 'product.backlog_prioritization', 'Backlog Prioritization & OKR Trackers', 'Sprints 49 & 51: Product', false),
  ('free', 'pm.adr_skills_raid', 'ADR, Team Skills & RAID Register', 'Sprint 51: Product', false),
  ('free', 'releases.management', 'Release Plans & Gate Signoffs', 'Sprints 44–47: Releases', false),
  ('free', 'governance.granular_rbac', 'Granular RBAC & Custom Roles', 'Phase 8: Governance', false),
  ('free', 'governance.approval_workflows', 'Formal Approval & Sign-off Workflows', 'Phase 8: Governance', false),
  ('free', 'governance.audit_logs', 'Compliance Audit Logs', 'Phase 8: Governance', false),
  ('free', 'governance.sso', 'SSO & Identity Provider Configuration', 'Phase 8: Governance', false),
  ('free', 'integrations.api_webhooks', 'REST API Keys & Outward Webhooks', 'Phase 9: Integrations', false),
  ('free', 'integrations.cloud_calendar', 'Calendar & Cloud Storage Attachments', 'Phase 9: Integrations', false),
  ('free', 'integrations.erp_connector', 'ERP Data Sync & Connectors', 'Phase 9: Integrations (Sprint 28)', false),

  -- PREMIUM TIER (Free + Starter + Business Modules)
  ('premium', 'foundation.workspace', 'Core Workspaces & Organization', 'Phase 1: Foundation', true),
  ('premium', 'planning.wbs', 'WBS & Basic Gantt Schedule', 'Phase 2: Planning Core', true),
  ('premium', 'cost.evm_engine', 'Earned Value Management (EVM)', 'Phase 3: Cost Core', true),
  ('premium', 'cost.resource_rates', 'Advanced Resource Rate Config', 'Phase 3: Cost Core', true),
  ('premium', 'cost.actuals_tracking', 'Actual Cost Logging & CSV Import', 'Phase 3: Cost Core', true),
  ('premium', 'accountability.raci', 'RACI Matrix Generator', 'Phase 4: Accountability', true),
  ('premium', 'accountability.risks', 'Risk & Issue Register', 'Phase 4: Accountability', true),
  ('premium', 'documentation.engine', 'Live Document Engine & Charters', 'Phase 5: Documentation', true),
  ('premium', 'documentation.status_reports', 'Automated Status Reports', 'Phase 5: Documentation', true),
  ('premium', 'documentation.custom_templates', 'Custom Document Templates & Exports', 'Phase 5: Documentation', true),
  ('premium', 'collaboration.realtime', 'Realtime Comments, Replies & Presence', 'Phase 6: Collaboration', true),
  ('premium', 'collaboration.notifications', 'In-App & Email Notifications', 'Phase 6: Collaboration', true),
  ('premium', 'reporting.analytics', 'Advanced Project Activity Logs & Charts', 'Phase 7: Reporting', true),
  ('premium', 'product.roadmap_gtm', 'Product Roadmap & Go-To-Market Plans', 'Sprint 52: Product', true),
  ('premium', 'product.backlog_prioritization', 'Backlog Prioritization & OKR Trackers', 'Sprints 49 & 51: Product', true),
  ('premium', 'pm.adr_skills_raid', 'ADR, Team Skills & RAID Register', 'Sprint 51: Product', true),
  ('premium', 'releases.management', 'Release Plans & Gate Signoffs', 'Sprints 44–47: Releases', true),
  ('premium', 'governance.granular_rbac', 'Granular RBAC & Custom Roles', 'Phase 8: Governance', false),
  ('premium', 'governance.approval_workflows', 'Formal Approval & Sign-off Workflows', 'Phase 8: Governance', false),
  ('premium', 'governance.audit_logs', 'Compliance Audit Logs', 'Phase 8: Governance', false),
  ('premium', 'governance.sso', 'SSO & Identity Provider Configuration', 'Phase 8: Governance', false),
  ('premium', 'integrations.api_webhooks', 'REST API Keys & Outward Webhooks', 'Phase 9: Integrations', false),
  ('premium', 'integrations.cloud_calendar', 'Calendar & Cloud Storage Attachments', 'Phase 9: Integrations', false),
  ('premium', 'integrations.erp_connector', 'ERP Data Sync & Connectors', 'Phase 9: Integrations (Sprint 28)', false),

  -- ENTERPRISE TIER (All 24 modules enabled)
  ('enterprise', 'foundation.workspace', 'Core Workspaces & Organization', 'Phase 1: Foundation', true),
  ('enterprise', 'planning.wbs', 'WBS & Basic Gantt Schedule', 'Phase 2: Planning Core', true),
  ('enterprise', 'cost.evm_engine', 'Earned Value Management (EVM)', 'Phase 3: Cost Core', true),
  ('enterprise', 'cost.resource_rates', 'Advanced Resource Rate Config', 'Phase 3: Cost Core', true),
  ('enterprise', 'cost.actuals_tracking', 'Actual Cost Logging & CSV Import', 'Phase 3: Cost Core', true),
  ('enterprise', 'accountability.raci', 'RACI Matrix Generator', 'Phase 4: Accountability', true),
  ('enterprise', 'accountability.risks', 'Risk & Issue Register', 'Phase 4: Accountability', true),
  ('enterprise', 'documentation.engine', 'Live Document Engine & Charters', 'Phase 5: Documentation', true),
  ('enterprise', 'documentation.status_reports', 'Automated Status Reports', 'Phase 5: Documentation', true),
  ('enterprise', 'documentation.custom_templates', 'Custom Document Templates & Exports', 'Phase 5: Documentation', true),
  ('enterprise', 'collaboration.realtime', 'Realtime Comments, Replies & Presence', 'Phase 6: Collaboration', true),
  ('enterprise', 'collaboration.notifications', 'In-App & Email Notifications', 'Phase 6: Collaboration', true),
  ('enterprise', 'reporting.analytics', 'Advanced Project Activity Logs & Charts', 'Phase 7: Reporting', true),
  ('enterprise', 'product.roadmap_gtm', 'Product Roadmap & Go-To-Market Plans', 'Sprint 52: Product', true),
  ('enterprise', 'product.backlog_prioritization', 'Backlog Prioritization & OKR Trackers', 'Sprints 49 & 51: Product', true),
  ('enterprise', 'pm.adr_skills_raid', 'ADR, Team Skills & RAID Register', 'Sprint 51: Product', true),
  ('enterprise', 'releases.management', 'Release Plans & Gate Signoffs', 'Sprints 44–47: Releases', true),
  ('enterprise', 'governance.granular_rbac', 'Granular RBAC & Custom Roles', 'Phase 8: Governance', true),
  ('enterprise', 'governance.approval_workflows', 'Formal Approval & Sign-off Workflows', 'Phase 8: Governance', true),
  ('enterprise', 'governance.audit_logs', 'Compliance Audit Logs', 'Phase 8: Governance', true),
  ('enterprise', 'governance.sso', 'SSO & Identity Provider Configuration', 'Phase 8: Governance', true),
  ('enterprise', 'integrations.api_webhooks', 'REST API Keys & Outward Webhooks', 'Phase 9: Integrations', true),
  ('enterprise', 'integrations.cloud_calendar', 'Calendar & Cloud Storage Attachments', 'Phase 9: Integrations', true),
  ('enterprise', 'integrations.erp_connector', 'ERP Data Sync & Connectors', 'Phase 9: Integrations (Sprint 28)', true)
ON CONFLICT (tier_id, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  display_name = EXCLUDED.display_name,
  module = EXCLUDED.module;

-- 9. BOOTSTRAP TRIGGER & FUNCTION: 14-day Enterprise Trial on Org Creation
CREATE OR REPLACE FUNCTION public.bootstrap_organization_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_subscriptions (
    organization_id,
    tier_id,
    seat_count,
    status,
    trial_start,
    trial_end,
    current_period_end
  ) VALUES (
    NEW.id,
    'enterprise',
    1,
    'trialing',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()) + interval '14 days',
    timezone('utc'::text, now()) + interval '14 days'
  ) ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_on_organization_created_subscription ON public.organizations;
CREATE TRIGGER tr_on_organization_created_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.bootstrap_organization_subscription();

-- 10. BACKFILL EXISTING ORGANIZATIONS
INSERT INTO public.organization_subscriptions (
  organization_id,
  tier_id,
  seat_count,
  status,
  trial_start,
  trial_end,
  current_period_end
)
SELECT 
  id as organization_id,
  'enterprise' as tier_id,
  1 as seat_count,
  'trialing' as status,
  timezone('utc'::text, now()) as trial_start,
  timezone('utc'::text, now()) + interval '14 days' as trial_end,
  timezone('utc'::text, now()) + interval '14 days' as current_period_end
FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- 11. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_feature_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to subscription tiers" ON public.subscription_tiers;
CREATE POLICY "Public read access to subscription tiers" ON public.subscription_tiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to tier feature map" ON public.tier_feature_map;
CREATE POLICY "Public read access to tier feature map" ON public.tier_feature_map
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to tier usage limits" ON public.tier_usage_limits;
CREATE POLICY "Public read access to tier usage limits" ON public.tier_usage_limits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can read organization subscriptions" ON public.organization_subscriptions;
CREATE POLICY "Members can read organization subscriptions" ON public.organization_subscriptions
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
  );

DROP POLICY IF EXISTS "Members can update organization subscriptions for testing" ON public.organization_subscriptions;
CREATE POLICY "Members can update organization subscriptions for testing" ON public.organization_subscriptions
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
  );
