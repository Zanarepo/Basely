-- Add custom per-organization AI limit overrides
-- When non-null, these override the tier-default limits for a specific org.
-- Superadmins can set these via the backoffice to grant allowances to specific customers.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS custom_ai_generations_limit INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_ai_basic_actions_limit INTEGER DEFAULT NULL;

COMMENT ON COLUMN organizations.custom_ai_generations_limit IS
  'If set, overrides the tier default max_ai_generations for this org. NULL = use tier default.';

COMMENT ON COLUMN organizations.custom_ai_basic_actions_limit IS
  'If set, overrides the tier default max_ai_basic_actions for this org. NULL = use tier default.';
