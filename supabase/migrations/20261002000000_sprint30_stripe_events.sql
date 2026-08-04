-- ============================================================================
-- Migration: Sprint 30 Back Office — Payment Processing & Checkout
-- Description: Creates the payment_events table for webhook idempotency processing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'processed' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We do not need RLS on this table as it's only accessed securely via the server-side webhook endpoint.
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment events are completely hidden from clients"
  ON public.payment_events
  FOR ALL
  USING (false);

-- Add payment_customer_id and payment_subscription_id to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS payment_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_subscription_id TEXT;
