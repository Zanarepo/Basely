-- ==============================================================================
-- Sprint 51: Enterprise Delivery Governance Migration (Resilient Schema)
-- Tables: Architecture Decision Records (ADR), Team Competency Skills Matrix, 
--         Capacity Bandwidth Allocations, and Unified RAID Command Center
-- Note: Uses TEXT for reference columns (organization_id, project_id, linked IDs)
--       to support both UUIDs and string identifiers (e.g. 'default_org', 'wbs-pkg-101').
-- ==============================================================================

-- 1. ARCHITECTURE DECISION RECORDS (ADR) TABLE
CREATE TABLE IF NOT EXISTS public.architecture_decision_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL DEFAULT 'default_org',
  project_id TEXT,
  document_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'accepted', 'deprecated', 'superseded', 'rejected')),
  context TEXT NOT NULL,
  decision TEXT NOT NULL,
  consequences TEXT NOT NULL,
  technical_domain TEXT NOT NULL CHECK (technical_domain IN ('backend', 'frontend', 'database', 'infrastructure', 'security', 'ai_data')),
  superseded_by_adr_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure column compatibility if table was previously created with UUID types
DO $$ 
BEGIN
  ALTER TABLE public.architecture_decision_records ALTER COLUMN organization_id TYPE TEXT USING organization_id::text;
  ALTER TABLE public.architecture_decision_records ALTER COLUMN project_id TYPE TEXT USING project_id::text;
  ALTER TABLE public.architecture_decision_records ALTER COLUMN document_id TYPE TEXT USING document_id::text;
  ALTER TABLE public.architecture_decision_records ALTER COLUMN superseded_by_adr_id TYPE TEXT USING superseded_by_adr_id::text;
  ALTER TABLE public.architecture_decision_records ALTER COLUMN created_by TYPE TEXT USING created_by::text;
EXCEPTION WHEN others THEN 
  -- Ignore minor cast errors if columns already match
END $$;

CREATE INDEX IF NOT EXISTS idx_adrs_org_project ON public.architecture_decision_records(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_adrs_status_domain ON public.architecture_decision_records(status, technical_domain);

ALTER TABLE public.architecture_decision_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users on ADRs" ON public.architecture_decision_records;
CREATE POLICY "Enable read access for authenticated users on ADRs"
  ON public.architecture_decision_records FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable write access for authenticated users on ADRs" ON public.architecture_decision_records;
CREATE POLICY "Enable write access for authenticated users on ADRs"
  ON public.architecture_decision_records FOR ALL
  USING (auth.role() = 'authenticated');


-- 2. TEAM COMPETENCY & SKILLS MATRIX PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.member_skill_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL DEFAULT 'default_org',
  user_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  skill_category TEXT NOT NULL CHECK (skill_category IN ('frontend', 'backend', 'devops', 'data_science', 'design', 'management')),
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience NUMERIC(3,1) DEFAULT 1.0,
  is_primary_specialization BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

DO $$ 
BEGIN
  ALTER TABLE public.member_skill_profiles ALTER COLUMN organization_id TYPE TEXT USING organization_id::text;
  ALTER TABLE public.member_skill_profiles ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN others THEN 
END $$;

CREATE INDEX IF NOT EXISTS idx_member_skills_org_user ON public.member_skill_profiles(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_category_level ON public.member_skill_profiles(skill_category, proficiency_level);

ALTER TABLE public.member_skill_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable authenticated users to view skill profiles" ON public.member_skill_profiles;
CREATE POLICY "Enable authenticated users to view skill profiles"
  ON public.member_skill_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable authenticated users to modify skill profiles" ON public.member_skill_profiles;
CREATE POLICY "Enable authenticated users to modify skill profiles"
  ON public.member_skill_profiles FOR ALL
  USING (auth.role() = 'authenticated');


-- 3. TEAM CAPACITY & BANDWIDTH ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.member_capacity_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL DEFAULT 'default_org',
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  iteration_id TEXT,
  wbs_phase_id TEXT,
  available_hours_per_week NUMERIC(5,2) DEFAULT 40.00,
  allocated_percentage INTEGER DEFAULT 100 CHECK (allocated_percentage BETWEEN 0 AND 100),
  sprint_velocity_points NUMERIC(5,2) DEFAULT 15.00,
  effective_start_date DATE NOT NULL,
  effective_end_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_capacity_allocations ADD COLUMN IF NOT EXISTS member_name TEXT;
ALTER TABLE public.member_capacity_allocations ADD COLUMN IF NOT EXISTS member_role TEXT;
ALTER TABLE public.member_capacity_allocations ADD COLUMN IF NOT EXISTS avatar_initials TEXT;

DO $$ 
BEGIN
  ALTER TABLE public.member_capacity_allocations ALTER COLUMN organization_id TYPE TEXT USING organization_id::text;
  ALTER TABLE public.member_capacity_allocations ALTER COLUMN project_id TYPE TEXT USING project_id::text;
  ALTER TABLE public.member_capacity_allocations ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  ALTER TABLE public.member_capacity_allocations ALTER COLUMN iteration_id TYPE TEXT USING iteration_id::text;
  ALTER TABLE public.member_capacity_allocations ALTER COLUMN wbs_phase_id TYPE TEXT USING wbs_phase_id::text;
EXCEPTION WHEN others THEN 
END $$;

CREATE INDEX IF NOT EXISTS idx_member_capacity_project_user ON public.member_capacity_allocations(project_id, user_id);

ALTER TABLE public.member_capacity_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for capacity allocations" ON public.member_capacity_allocations;
CREATE POLICY "Enable read access for capacity allocations"
  ON public.member_capacity_allocations FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable write access for capacity allocations" ON public.member_capacity_allocations;
CREATE POLICY "Enable write access for capacity allocations"
  ON public.member_capacity_allocations FOR ALL
  USING (auth.role() = 'authenticated');


-- 4. UNIFIED RAID LOG ENTRIES TABLE (Risks, Assumptions, Issues, Dependencies)
CREATE TABLE IF NOT EXISTS public.raid_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL DEFAULT 'default_org',
  project_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('risk', 'assumption', 'issue', 'dependency')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'mitigated', 'closed', 'verified', 'invalidated')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  owner_id TEXT,
  external_owner_name TEXT,
  target_resolution_date DATE,
  validation_due_date DATE,
  impact_rating INTEGER CHECK (impact_rating BETWEEN 1 AND 5) DEFAULT 3,
  probability_rating INTEGER CHECK (probability_rating BETWEEN 1 AND 5) DEFAULT 3,
  mitigation_plan TEXT,
  linked_wbs_element_id TEXT,
  linked_sprint_item_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ 
BEGIN
  ALTER TABLE public.raid_log_entries ALTER COLUMN organization_id TYPE TEXT USING organization_id::text;
  ALTER TABLE public.raid_log_entries ALTER COLUMN project_id TYPE TEXT USING project_id::text;
  ALTER TABLE public.raid_log_entries ALTER COLUMN owner_id TYPE TEXT USING owner_id::text;
  ALTER TABLE public.raid_log_entries ALTER COLUMN linked_wbs_element_id TYPE TEXT USING linked_wbs_element_id::text;
  ALTER TABLE public.raid_log_entries ALTER COLUMN linked_sprint_item_id TYPE TEXT USING linked_sprint_item_id::text;
  ALTER TABLE public.raid_log_entries ALTER COLUMN created_by TYPE TEXT USING created_by::text;
EXCEPTION WHEN others THEN 
END $$;

CREATE INDEX IF NOT EXISTS idx_raid_log_project_cat ON public.raid_log_entries(project_id, category);
CREATE INDEX IF NOT EXISTS idx_raid_log_linked_wbs ON public.raid_log_entries(linked_wbs_element_id);
CREATE INDEX IF NOT EXISTS idx_raid_log_status_priority ON public.raid_log_entries(status, priority);

ALTER TABLE public.raid_log_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable users to view RAID log entries" ON public.raid_log_entries;
CREATE POLICY "Enable users to view RAID log entries"
  ON public.raid_log_entries FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable users to modify RAID log entries" ON public.raid_log_entries;
CREATE POLICY "Enable users to modify RAID log entries"
  ON public.raid_log_entries FOR ALL
  USING (auth.role() = 'authenticated');


-- 5. FORCE POSTGREST SCHEMA CACHE RELOAD
-- This resolves 'PGRST205: Could not find table in the schema cache' immediately
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

