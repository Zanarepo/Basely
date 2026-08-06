-- ============================================================================
-- Migration: SOC 2 Evidence & Per-Tenant Backups (Sprint 49)
-- Description: Create private storage buckets for compliance evidence and backups.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('soc2_compliance_evidence', 'soc2_compliance_evidence', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant_backups', 'tenant_backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for soc2_compliance_evidence
CREATE POLICY "Superadmins can manage SOC 2 Evidence"
ON storage.objects FOR ALL TO authenticated
USING (
    bucket_id = 'soc2_compliance_evidence' 
    AND EXISTS (
        SELECT 1 FROM public.internal_staff 
        WHERE auth_user_id = auth.uid() AND role = 'superadmin'
    )
)
WITH CHECK (
    bucket_id = 'soc2_compliance_evidence' 
    AND EXISTS (
        SELECT 1 FROM public.internal_staff 
        WHERE auth_user_id = auth.uid() AND role = 'superadmin'
    )
);

-- RLS for tenant_backups
CREATE POLICY "Superadmins can manage tenant backups"
ON storage.objects FOR ALL TO authenticated
USING (
    bucket_id = 'tenant_backups' 
    AND EXISTS (
        SELECT 1 FROM public.internal_staff 
        WHERE auth_user_id = auth.uid() AND role = 'superadmin'
    )
)
WITH CHECK (
    bucket_id = 'tenant_backups' 
    AND EXISTS (
        SELECT 1 FROM public.internal_staff 
        WHERE auth_user_id = auth.uid() AND role = 'superadmin'
    )
);
