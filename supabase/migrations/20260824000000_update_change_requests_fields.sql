-- Add cost_impact and schedule_impact_days
ALTER TABLE public.change_request_log_entries ADD COLUMN IF NOT EXISTS cost_impact NUMERIC DEFAULT 0;
ALTER TABLE public.change_request_log_entries ADD COLUMN IF NOT EXISTS schedule_impact_days INTEGER DEFAULT 0;

-- Update the outcome check constraint to allow 'pending_sponsor_approval'
ALTER TABLE public.change_request_log_entries DROP CONSTRAINT IF EXISTS change_request_log_entries_outcome_check;
ALTER TABLE public.change_request_log_entries ADD CONSTRAINT change_request_log_entries_outcome_check CHECK (outcome IN ('pending', 'pending_sponsor_approval', 'approved', 'rejected', 'withdrawn'));

-- Update the approval_policies action_type constraint to allow 'change_request'
ALTER TABLE public.approval_policies DROP CONSTRAINT IF EXISTS approval_policies_action_type_check;
ALTER TABLE public.approval_policies ADD CONSTRAINT approval_policies_action_type_check 
  CHECK (action_type IN ('budget_baseline', 'schedule_baseline', 'release_promotion', 'change_request'));
