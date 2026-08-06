-- ============================================================================
-- Migration: Backoffice Promotions & Coupons
-- Description: Superadmin management of marketing promos (Sprint 33)
-- ============================================================================

CREATE TYPE public.promo_discount_type AS ENUM (
  'percentage',
  'fixed_amount'
);

CREATE TYPE public.promo_duration AS ENUM (
  'once',
  'repeating',
  'forever'
);

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.promo_discount_type NOT NULL,
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  
  -- Duration & constraints
  duration public.promo_duration NOT NULL DEFAULT 'once',
  duration_in_months INTEGER, -- Only used if duration is 'repeating'
  
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  
  -- Scoping for exclusive offers
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- External Gateway References
  stripe_coupon_id TEXT,
  paystack_coupon_id TEXT,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.internal_staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Validation logic
  CONSTRAINT percentage_limit CHECK (
    discount_type != 'percentage' OR discount_value <= 100
  )
);

CREATE INDEX idx_promotions_code ON public.promotions(code);
CREATE INDEX idx_promotions_active ON public.promotions(is_active) WHERE is_active = true;
CREATE INDEX idx_promotions_org ON public.promotions(organization_id);

-- RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 1. All authenticated users (customers) can read active promotions (to apply them at checkout)
CREATE POLICY "Anyone can view active promotions"
  ON public.promotions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 2. Staff can view all promotions (active and inactive)
CREATE POLICY "Staff can view all promotions"
  ON public.promotions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_staff
      WHERE internal_staff.auth_user_id = auth.uid()
    )
  );

-- 3. Only Superadmins can insert, update, or delete promotions
CREATE POLICY "Only superadmins can manage promotions"
  ON public.promotions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_staff
      WHERE internal_staff.auth_user_id = auth.uid()
      AND internal_staff.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.internal_staff
      WHERE internal_staff.auth_user_id = auth.uid()
      AND internal_staff.role = 'superadmin'
    )
  );
