-- ============================================================================
-- Migration: Add project_id to support_tickets
-- Description: Allow users to link a support ticket to a specific project
-- ============================================================================

ALTER TABLE public.support_tickets 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX idx_support_tickets_project ON public.support_tickets(project_id);
