-- Add missing enum values to activity_entity_type for Product Strategy & Discovery modules

ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'discovery_insight';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'persona';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'product_strategy';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'kpi';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'okr_objective';
