-- Add limits for sprints and releases

INSERT INTO public.tier_usage_limits (tier_id, limit_key, max_value)
VALUES 
  ('free', 'max_sprints', 3),
  ('free', 'max_releases', 2),
  ('premium', 'max_sprints', -1),
  ('premium', 'max_releases', -1),
  ('enterprise', 'max_sprints', -1),
  ('enterprise', 'max_releases', -1)
ON CONFLICT (tier_id, limit_key) DO UPDATE 
  SET max_value = EXCLUDED.max_value;
