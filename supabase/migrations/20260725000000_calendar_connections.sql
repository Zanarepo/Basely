-- Migration: Calendar Connections (Sprint 25)

CREATE TYPE calendar_provider AS ENUM ('google');

CREATE TABLE public.calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider calendar_provider NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    synced_project_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a user can only have one connection per provider
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own calendar connections
CREATE POLICY "Users can view their own calendar connections" 
    ON public.calendar_connections 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connections" 
    ON public.calendar_connections 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections" 
    ON public.calendar_connections 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar connections" 
    ON public.calendar_connections 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_calendar_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update trigger
CREATE TRIGGER handle_updated_at_calendar_connections
    BEFORE UPDATE ON public.calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_connections_updated_at();
