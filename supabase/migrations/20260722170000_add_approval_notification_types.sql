-- Add new trigger types for approval workflows
ALTER TYPE public.notification_trigger_type ADD VALUE IF NOT EXISTS 'approval_request';
ALTER TYPE public.notification_trigger_type ADD VALUE IF NOT EXISTS 'approval_update';
