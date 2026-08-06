-- ============================================================================
-- Migration: Sprint 48 Back Office — Analytics & Retention Intelligence
-- Description: Creates billing history, churn risk scores, win-back campaigns,
-- and pg_cron jobs for nightly calculations.
-- ============================================================================

-- 1. BILLING HISTORY
-- Records historical payments to calculate actual LTV
CREATE TABLE IF NOT EXISTS public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  amount_due NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  status TEXT DEFAULT 'paid' NOT NULL CHECK (status IN ('paid', 'failed', 'pending', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CHURN RISK SCORES
-- Rules-based scoring evaluated nightly
CREATE TABLE IF NOT EXISTS public.churn_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  contributing_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. WIN-BACK CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.win_back_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'recovered', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ANALYTICS PRE-COMPUTATION (COHORT)
-- We store cohort aggregations in a materialized view or a table to avoid heavy scans on the dashboard.
-- For simplicity and realtime capabilities, we'll create a table updated nightly.
CREATE TABLE IF NOT EXISTS public.cohort_retention_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_month TEXT NOT NULL, -- e.g., '2026-07'
  tier_id TEXT NOT NULL,
  months_since_signup INTEGER NOT NULL,
  active_orgs INTEGER NOT NULL DEFAULT 0,
  total_orgs INTEGER NOT NULL DEFAULT 0,
  retention_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_cohort_stats UNIQUE (cohort_month, tier_id, months_since_signup)
);

-- ============================================================================
-- STORED PROCEDURES FOR ANALYTICS (Called via pg_cron or RPC)
-- ============================================================================

-- A. Calculate Churn Risk Scores
CREATE OR REPLACE FUNCTION public.calculate_all_churn_risks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org RECORD;
  calc_score INTEGER;
  signals JSONB;
  feature_score INTEGER;
  login_score INTEGER;
  payment_score INTEGER;
  failed_payments INTEGER;
  active_users INTEGER;
  total_users INTEGER;
  active_projects INTEGER;
BEGIN
  -- Basic heuristics as per SaaS standards (40% Feature Depth, 40% Login Recency/Freq, 20% Payment History)
  FOR org IN SELECT id FROM public.organizations LOOP
    -- 1. Feature Depth (Proxy: Active projects)
    SELECT count(*) INTO active_projects FROM public.projects WHERE organization_id = org.id AND status = 'active';
    IF active_projects > 5 THEN feature_score := 100;
    ELSIF active_projects > 2 THEN feature_score := 70;
    ELSIF active_projects > 0 THEN feature_score := 40;
    ELSE feature_score := 0; END IF;

    -- 2. Login Recency / Frequency (Proxy: percentage of members with recent activity, or just total members for now)
    SELECT count(*) INTO total_users FROM public.organization_members WHERE organization_id = org.id;
    -- Note: In a real system we'd check `auth.users.last_sign_in_at`. We'll approximate for Sprint 48.
    IF total_users > 10 THEN login_score := 100;
    ELSIF total_users > 3 THEN login_score := 60;
    ELSIF total_users > 0 THEN login_score := 30;
    ELSE login_score := 0; END IF;

    -- 3. Payment History
    SELECT count(*) INTO failed_payments FROM public.billing_history WHERE organization_id = org.id AND status = 'failed';
    IF failed_payments = 0 THEN payment_score := 100;
    ELSIF failed_payments = 1 THEN payment_score := 50;
    ELSE payment_score := 0; END IF;

    -- Calculate weighted score
    calc_score := (feature_score * 0.40) + (login_score * 0.40) + (payment_score * 0.20);
    
    -- High score = High Health. To match "Churn Risk", we invert it: Risk = 100 - Health.
    calc_score := 100 - calc_score;

    signals := jsonb_build_object(
      'feature_depth_score', feature_score,
      'login_frequency_score', login_score,
      'payment_history_score', payment_score,
      'failed_payments_count', failed_payments,
      'active_projects_count', active_projects,
      'weighting_model', '40/40/20 standard'
    );

    INSERT INTO public.churn_risk_scores (organization_id, score, contributing_signals, calculated_at)
    VALUES (org.id, calc_score, signals, now())
    ON CONFLICT (organization_id) DO UPDATE SET
      score = EXCLUDED.score,
      contributing_signals = EXCLUDED.contributing_signals,
      calculated_at = EXCLUDED.calculated_at;
  END LOOP;
END;
$$;

-- B. Calculate Cohort Retention
CREATE OR REPLACE FUNCTION public.calculate_cohort_retention()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Truncate and rebuild for simplicity in Sprint 48
  TRUNCATE TABLE public.cohort_retention_stats;

  INSERT INTO public.cohort_retention_stats (cohort_month, tier_id, months_since_signup, active_orgs, total_orgs, retention_rate)
  SELECT
    to_char(o.created_at, 'YYYY-MM') AS cohort_month,
    COALESCE(s.tier_id, 'free') AS tier_id,
    extract(month from age(now(), o.created_at))::INTEGER AS months_since_signup,
    COUNT(CASE WHEN s.status IN ('active', 'trialing') THEN 1 END) AS active_orgs,
    COUNT(*) AS total_orgs,
    (COUNT(CASE WHEN s.status IN ('active', 'trialing') THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100.0 AS retention_rate
  FROM public.organizations o
  LEFT JOIN public.organization_subscriptions s ON s.organization_id = o.id
  GROUP BY to_char(o.created_at, 'YYYY-MM'), COALESCE(s.tier_id, 'free'), extract(month from age(now(), o.created_at));
END;
$$;

-- C. Trigger Win-Back Campaigns
-- In Supabase, pg_net or webhook triggers can be used. For simplicity, we just insert pending records
-- and let a database webhook (Sprint 17 infra) handle the HTTP request on INSERT to `win_back_campaigns`.
CREATE OR REPLACE FUNCTION public.schedule_win_back_campaigns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org RECORD;
BEGIN
  -- Find canceled subscriptions that do not have a win-back campaign scheduled
  FOR org IN
    SELECT s.organization_id 
    FROM public.organization_subscriptions s
    LEFT JOIN public.win_back_campaigns wbc ON wbc.organization_id = s.organization_id
    WHERE s.status = 'canceled' AND wbc.id IS NULL
  LOOP
    INSERT INTO public.win_back_campaigns (organization_id, status, scheduled_for)
    VALUES (org.organization_id, 'pending', now() + interval '7 days');
  END LOOP;
END;
$$;

-- ============================================================================
-- ENABLE PG_CRON AND SCHEDULE JOBS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule jobs to run every night at 2:00 AM UTC
SELECT cron.schedule(
  'calculate-cohort-retention-nightly',
  '0 2 * * *',
  'SELECT public.calculate_cohort_retention()'
);

SELECT cron.schedule(
  'calculate-churn-risks-nightly',
  '5 2 * * *',
  'SELECT public.calculate_all_churn_risks()'
);

SELECT cron.schedule(
  'schedule-win-back-campaigns-nightly',
  '10 2 * * *',
  'SELECT public.schedule_win_back_campaigns()'
);

-- Enable RLS (Internal tables)
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.win_back_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_retention_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Billing hidden from clients" ON public.billing_history FOR ALL USING (false);
CREATE POLICY "Churn Risk hidden from clients" ON public.churn_risk_scores FOR ALL USING (false);
CREATE POLICY "Win-back hidden from clients" ON public.win_back_campaigns FOR ALL USING (false);
CREATE POLICY "Cohort hidden from clients" ON public.cohort_retention_stats FOR ALL USING (false);
