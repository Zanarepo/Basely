-- ============================================================================
-- Migration: Backoffice Admin Notifications
-- Description: Intelligent routing of notifications to internal staff (Sprint 33)
-- ============================================================================

CREATE TYPE public.backoffice_notification_type AS ENUM (
  'payment_failed',
  'payment_succeeded',
  'plan_changed',
  'account_risk',
  'support_request',
  'system_alert',
  'promo_created'
);

CREATE TABLE IF NOT EXISTS public.backoffice_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.internal_staff(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  type public.backoffice_notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_backoffice_notifications_staff ON public.backoffice_notifications(staff_id);
CREATE INDEX idx_backoffice_notifications_unread ON public.backoffice_notifications(staff_id) WHERE is_read = false;

-- RLS
ALTER TABLE public.backoffice_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their own notifications"
  ON public.backoffice_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_staff
      WHERE internal_staff.auth_user_id = auth.uid()
      AND internal_staff.id = backoffice_notifications.staff_id
    )
  );

CREATE POLICY "Staff can update their own notifications"
  ON public.backoffice_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_staff
      WHERE internal_staff.auth_user_id = auth.uid()
      AND internal_staff.id = backoffice_notifications.staff_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.internal_staff
      WHERE internal_staff.auth_user_id = auth.uid()
      AND internal_staff.id = backoffice_notifications.staff_id
    )
  );

-- Routing Functions

-- Notify specific org: Routes to Account Managers if assigned, otherwise Superadmins
CREATE OR REPLACE FUNCTION public.notify_backoffice_org(
  p_org_id UUID,
  p_type public.backoffice_notification_type,
  p_title TEXT,
  p_message TEXT
) RETURNS VOID AS $$
DECLARE
  v_assigned_staff_exists BOOLEAN;
BEGIN
  -- Check if the org has assigned staff (Account Managers)
  SELECT EXISTS(
    SELECT 1 FROM public.account_assignments WHERE organization_id = p_org_id
  ) INTO v_assigned_staff_exists;

  IF v_assigned_staff_exists THEN
    -- Notify the assigned staff
    INSERT INTO public.backoffice_notifications (staff_id, organization_id, type, title, message)
    SELECT staff_id, p_org_id, p_type, p_title, p_message
    FROM public.account_assignments
    WHERE organization_id = p_org_id;
  ELSE
    -- Notify all superadmins
    INSERT INTO public.backoffice_notifications (staff_id, organization_id, type, title, message)
    SELECT id, p_org_id, p_type, p_title, p_message
    FROM public.internal_staff
    WHERE role = 'superadmin';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Broadcast: Routes to all Superadmins
CREATE OR REPLACE FUNCTION public.notify_all_superadmins(
  p_type public.backoffice_notification_type,
  p_title TEXT,
  p_message TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.backoffice_notifications (staff_id, organization_id, type, title, message)
  SELECT id, NULL, p_type, p_title, p_message
  FROM public.internal_staff
  WHERE role = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
