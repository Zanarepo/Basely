-- ============================================================================
-- Migration: Sprint 32 Internal Roles & Account Management
-- Description: Adds account manager role, assignments, and health notes.
-- ============================================================================

-- 1. ADD NEW ROLES TO ENUM
ALTER TYPE public.internal_staff_role ADD VALUE IF NOT EXISTS 'account_manager';
ALTER TYPE public.internal_staff_role ADD VALUE IF NOT EXISTS 'support_admin';

-- 2. CREATE ACCOUNT ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.account_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.internal_staff(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, staff_id)
);

-- 3. CREATE TENANT HEALTH NOTES TABLE
CREATE TABLE IF NOT EXISTS public.tenant_health_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.internal_staff(id) ON DELETE SET NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'at-risk', 'churning')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RLS POLICIES FOR NEW TABLES
ALTER TABLE public.account_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_health_notes ENABLE ROW LEVEL SECURITY;

-- Internal staff can read all account assignments
CREATE POLICY "Internal staff can read account assignments" ON public.account_assignments
  FOR SELECT USING (public.is_internal_staff(auth.uid()));

-- Superadmins can manage account assignments
CREATE POLICY "Superadmins can manage account assignments" ON public.account_assignments
  FOR ALL USING (public.is_superadmin(auth.uid()));

-- Internal staff can read all health notes
CREATE POLICY "Internal staff can read health notes" ON public.tenant_health_notes
  FOR SELECT USING (public.is_internal_staff(auth.uid()));

-- Staff can insert health notes
CREATE POLICY "Staff can insert health notes" ON public.tenant_health_notes
  FOR INSERT WITH CHECK (public.is_internal_staff(auth.uid()));
