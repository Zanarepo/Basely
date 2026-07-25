-- Sprint 26: File Storage Integration (Attachments)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_source_type') THEN
        CREATE TYPE public.attachment_source_type AS ENUM ('local', 'google_drive', 'sharepoint');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    source_type attachment_source_type NOT NULL DEFAULT 'local',
    external_reference TEXT,
    external_url TEXT,
    file_path TEXT,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by entity
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_project ON public.attachments(project_id);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments if they have access to the project
DROP POLICY IF EXISTS "Users can view project attachments" ON public.attachments;
CREATE POLICY "Users can view project attachments" ON public.attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = attachments.project_id
            AND (
                public.is_workspace_owner(p.organization_id, auth.uid()) OR
                public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin', 'PM') OR
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.project_members pm
                    WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Users can create attachments if they have access to the project
DROP POLICY IF EXISTS "Users can create attachments" ON public.attachments;
CREATE POLICY "Users can create attachments" ON public.attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = attachments.project_id
            AND (
                public.is_workspace_owner(p.organization_id, auth.uid()) OR
                public.get_user_role_in_org(p.organization_id, auth.uid()) IN ('Admin', 'PM') OR
                p.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.project_members pm
                    WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Users can delete their own attachments, or project admins can delete any
DROP POLICY IF EXISTS "Users can delete attachments" ON public.attachments;
CREATE POLICY "Users can delete attachments" ON public.attachments
    FOR DELETE USING (
        uploaded_by_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = attachments.project_id
            AND (
                public.is_workspace_owner(p.organization_id, auth.uid()) OR
                public.get_user_role_in_org(p.organization_id, auth.uid()) = 'Admin'::public.user_role
            )
        )
    );
