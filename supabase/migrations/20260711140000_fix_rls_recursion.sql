-- Migration: Fix RLS recursion and update organization_members select policy
-- Version: 20260711140000_fix_rls_recursion

-- 1. Create helper functions to break RLS recursion
CREATE OR REPLACE FUNCTION public.is_workspace_owner(p_org_id uuid, p_user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = p_org_id AND owner_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_all_organizations(user_uuid uuid)
RETURNS TABLE (organization_id uuid)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
    SELECT organization_id FROM public.organization_members WHERE user_id = user_uuid;
$$;

-- 2. Drop the recursive and loose policies
DROP POLICY IF EXISTS "Allow members to read members in same organization" ON public.organization_members;
DROP POLICY IF EXISTS "Allow users to read their own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Allow members and admins to read organization members" ON public.organization_members;

-- 3. Create the new non-recursive SELECT policy for organization_members
CREATE POLICY "Allow members and admins to read organization members"
    ON public.organization_members FOR SELECT
    USING (
        (auth.uid() = user_id)
        OR public.is_workspace_owner(organization_id, auth.uid())
        OR (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    );

-- 4. Update public.organizations SELECT policy to use the helper function (breaking recursion)
DROP POLICY IF EXISTS "Allow members to read organization details" ON public.organizations;
CREATE POLICY "Allow members to read organization details"
    ON public.organizations FOR SELECT
    USING (id IN (SELECT organization_id FROM public.get_user_all_organizations(auth.uid())));
