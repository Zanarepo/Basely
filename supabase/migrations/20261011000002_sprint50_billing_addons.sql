-- Sprint 50: Multi-Currency & Usage-Based Pricing

-- 1. Add Currency to Subscriptions
ALTER TABLE public.organization_subscriptions 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- 2. Add Billing Model to Tiers
-- We support 'flat_rate' and 'usage_based'
ALTER TABLE public.subscription_tiers 
ADD COLUMN IF NOT EXISTS billing_model TEXT NOT NULL DEFAULT 'flat_rate' CHECK (billing_model IN ('flat_rate', 'usage_based')),
ADD COLUMN IF NOT EXISTS metered_unit_price DECIMAL(10,2) DEFAULT 0.00;

-- 3. Seed a Usage-Based Tier (for negotiated Enterprise deals)
INSERT INTO public.subscription_tiers (id, name, price_per_seat, billing_cycle, description, billing_model, metered_unit_price)
VALUES (
    'enterprise_metered', 
    'Enterprise (Usage-Based)', 
    0.00, 
    'monthly', 
    'Custom usage-based pricing for negotiated deals.', 
    'usage_based', 
    1.50 -- e.g., $1.50 per unit of usage
)
ON CONFLICT (id) DO UPDATE SET 
    billing_model = EXCLUDED.billing_model,
    metered_unit_price = EXCLUDED.metered_unit_price;

-- Note: Actual tracking of usage (e.g., API calls, storage) would write to a metered_usage log,
-- which Stripe/billing processor would read at the end of the billing cycle.
