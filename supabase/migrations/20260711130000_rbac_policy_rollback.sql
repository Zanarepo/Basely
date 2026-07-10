-- Migration: Rollback the admin/owner read policy for organization_members
-- Version: 20260711130000_rbac_policy_rollback

-- Drop the policy that allowed admins and owners to read all members
DROP POLICY IF EXISTS "Allow members and admins to read organization members" ON public.organization_members;

-- Note: The original policy allowing users to read their own memberships
-- ("Allow users to read their own memberships") remains unchanged.
