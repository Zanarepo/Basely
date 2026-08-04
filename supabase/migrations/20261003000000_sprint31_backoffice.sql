-- ============================================================================
-- Migration: Sprint 31 Back Office — Super Admin Console
-- Description: Creates internal staff, tenant overrides log, and impersonation log tables.
-- ============================================================================

-- 1. INTERNAL STAFF ENUM
DO $$ BEGIN
  CREATE TYPE public.internal_staff_role AS ENUM ('superadmin', 'support_senior', 'support_junior');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. INTERNAL STAFF TABLE
CREATE TABLE IF NOT EXISTS public.internal_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role public.internal_staff_role DEFAULT 'support_junior' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TENANT OVERRIDES LOG TABLE
CREATE TABLE IF NOT EXISTS public.tenant_overrides_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.internal_staff(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- e.g., 'tier_change', 'status_change', 'seat_change'
  old_value TEXT,
  new_value TEXT,
  justification TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. IMPERSONATION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.internal_staff(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT
);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.internal_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_overrides_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if a user is internal staff (SECURITY DEFINER bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_internal_staff(check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = check_user_id);
$$;

-- Helper function to check if a user is a superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.internal_staff WHERE auth_user_id = check_user_id AND role = 'superadmin');
$$;

-- Any authenticated user can check if their OWN auth_user_id is in internal_staff (self-read)
DROP POLICY IF EXISTS "Users can read own staff row" ON public.internal_staff;
CREATE POLICY "Users can read own staff row" ON public.internal_staff
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Internal staff can read ALL internal_staff rows (for listing in backoffice)
DROP POLICY IF EXISTS "Internal staff can read internal_staff" ON public.internal_staff;
CREATE POLICY "Internal staff can read internal_staff" ON public.internal_staff
  FOR SELECT USING (public.is_internal_staff(auth.uid()));

-- Superadmins can manage (INSERT/UPDATE/DELETE) internal staff
DROP POLICY IF EXISTS "Superadmins can manage internal_staff" ON public.internal_staff;
CREATE POLICY "Superadmins can manage internal_staff" ON public.internal_staff
  FOR ALL USING (public.is_superadmin(auth.uid()));

-- Internal staff can read overrides
DROP POLICY IF EXISTS "Internal staff can read overrides" ON public.tenant_overrides_log;
CREATE POLICY "Internal staff can read overrides" ON public.tenant_overrides_log
  FOR SELECT USING (public.is_internal_staff(auth.uid()));

-- Internal staff can insert overrides
DROP POLICY IF EXISTS "Internal staff can insert overrides" ON public.tenant_overrides_log;
CREATE POLICY "Internal staff can insert overrides" ON public.tenant_overrides_log
  FOR INSERT WITH CHECK (public.is_internal_staff(auth.uid()));

-- Internal staff can read impersonation logs
DROP POLICY IF EXISTS "Internal staff can read impersonation logs" ON public.impersonation_logs;
CREATE POLICY "Internal staff can read impersonation logs" ON public.impersonation_logs
  FOR SELECT USING (public.is_internal_staff(auth.uid()));

-- Internal staff can insert/update impersonation logs
DROP POLICY IF EXISTS "Internal staff can manage impersonation logs" ON public.impersonation_logs;
CREATE POLICY "Internal staff can manage impersonation logs" ON public.impersonation_logs
  FOR ALL USING (public.is_internal_staff(auth.uid()));

-- 6. BOOTSTRAP INITIAL SUPERADMIN
-- Automatically grant Superadmin status to pzana.fred@gmail.com if their account already exists in profiles/auth.users
INSERT INTO public.internal_staff (auth_user_id, email, role)
SELECT id, email, 'superadmin'::public.internal_staff_role
FROM public.profiles
WHERE email = 'pzana.fred@gmail.com'
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'superadmin'::public.internal_staff_role;
