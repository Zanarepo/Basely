-- Sprint 17: Collaboration Layer - Notifications

CREATE TYPE notification_trigger_type AS ENUM (
    'mention',
    'assignment',
    'risk_change',
    'cost_change',
    'schedule_change',
    'document_change',
    'status_report'
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trigger_type notification_trigger_type NOT NULL,
    reference_entity_type TEXT NOT NULL,
    reference_entity_id UUID NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    content_summary TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    slack_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications Policies: Strictly bound to user_id = auth.uid()
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

-- Notification Preferences Policies: Strictly bound to user_id = auth.uid()
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

-- Triggers for updated_at on preferences
CREATE TRIGGER set_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_updated_at();
