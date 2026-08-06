-- ============================================================================
-- Migration: Backoffice Promotions Multi-Org
-- Description: Convert promotions.organization_id to a junction table
-- ============================================================================

-- 1. Create junction table
CREATE TABLE promotion_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a promo is only linked to an org once
    UNIQUE(promotion_id, organization_id)
);

-- 2. Migrate existing data from promotions.organization_id
INSERT INTO promotion_organizations (promotion_id, organization_id)
SELECT id, organization_id 
FROM promotions 
WHERE organization_id IS NOT NULL;

-- 3. Drop old column
ALTER TABLE promotions DROP COLUMN organization_id;

-- 4. Enable RLS on junction table
ALTER TABLE promotion_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage promotion_organizations"
    ON promotion_organizations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM internal_staff 
            WHERE internal_staff.auth_user_id = auth.uid() 
            AND internal_staff.role = 'superadmin'
        )
    );

-- Customers can view links for their own org
CREATE POLICY "Customers can view their promotion links"
    ON promotion_organizations
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );
