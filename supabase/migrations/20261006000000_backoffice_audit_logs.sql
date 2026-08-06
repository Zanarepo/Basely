-- Create backoffice_audit_logs table
CREATE TABLE IF NOT EXISTS public.backoffice_audit_logs (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    admin_id uuid NOT NULL,
    action_type text NOT NULL,
    target_tier text,
    details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    CONSTRAINT backoffice_audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT backoffice_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.internal_staff(auth_user_id) ON DELETE SET NULL
);

-- RLS Policies
ALTER TABLE public.backoffice_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to internal staff
CREATE POLICY "Internal staff can view backoffice audit logs" 
    ON public.backoffice_audit_logs 
    FOR SELECT 
    USING (public.is_internal_staff(auth.uid()));

-- Allow insert access to internal staff
CREATE POLICY "Internal staff can insert backoffice audit logs" 
    ON public.backoffice_audit_logs 
    FOR INSERT 
    WITH CHECK (public.is_internal_staff(auth.uid()));
