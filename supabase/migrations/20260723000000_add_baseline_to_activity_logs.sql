-- Add new enum values to activity_entity_type if they don't exist
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'budget_baseline';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'schedule_baseline';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'actuals';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'estimations';
ALTER TYPE public.activity_entity_type ADD VALUE IF NOT EXISTS 'resources';
