-- Migration: Add sections 11-15 (differentiation, strategic_bets, product_principles, product_goals) to product_strategies
-- Version: 20261017000000_strategy_canvas_sections_11_15

BEGIN;

ALTER TABLE public.product_strategies ADD COLUMN IF NOT EXISTS differentiation JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.product_strategies ADD COLUMN IF NOT EXISTS strategic_bets JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.product_strategies ADD COLUMN IF NOT EXISTS product_principles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.product_strategies ADD COLUMN IF NOT EXISTS product_goals JSONB DEFAULT '[]'::jsonb;

COMMIT;
