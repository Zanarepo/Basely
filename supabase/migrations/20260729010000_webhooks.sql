-- Sprint 27: Webhook Infrastructure

CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type public.notification_trigger_type NOT NULL,
    target_url TEXT NOT NULL,
    signing_secret TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup during event dispatching
CREATE INDEX idx_webhooks_org ON public.webhook_subscriptions(organization_id);
CREATE INDEX idx_webhooks_event ON public.webhook_subscriptions(event_type);

-- Enable RLS
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- Webhooks RLS Policies: Only Organization Admins can view/manage

CREATE POLICY "Org Admins can view webhooks" ON public.webhook_subscriptions
    FOR SELECT USING (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'
    );

CREATE POLICY "Org Admins can insert webhooks" ON public.webhook_subscriptions
    FOR INSERT WITH CHECK (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'
    );

CREATE POLICY "Org Admins can update webhooks" ON public.webhook_subscriptions
    FOR UPDATE USING (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'
    );

CREATE POLICY "Org Admins can delete webhooks" ON public.webhook_subscriptions
    FOR DELETE USING (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'
    );

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at_webhooks
    BEFORE UPDATE ON public.webhook_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_updated_at();

-- Delivery Attempts Table for Retries and Audit
CREATE TABLE IF NOT EXISTS public.webhook_delivery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'success', 'failed'
    http_status_code INTEGER,
    response_body TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_delivery_sub ON public.webhook_delivery_attempts(subscription_id);
CREATE INDEX idx_webhook_delivery_retry ON public.webhook_delivery_attempts(status, next_retry_at) WHERE status = 'failed' AND next_retry_at IS NOT NULL;


base_live_CwKupJKo6JeX79bkKUoWVzAxIBgYLHTNTj29trE5KFE