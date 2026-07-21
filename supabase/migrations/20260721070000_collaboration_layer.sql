-- Sprint 16: Collaboration Layer (Comments & Mentions)

CREATE TYPE commentable_entity_type AS ENUM ('activity', 'document', 'risk', 'issue');

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    entity_type commentable_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    author_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id);
CREATE INDEX idx_comments_project ON public.comments(project_id);

CREATE TABLE IF NOT EXISTS public.mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    mentioned_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    mentioned_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT check_mention_target CHECK (mentioned_stakeholder_id IS NOT NULL OR mentioned_user_id IS NOT NULL)
);

CREATE INDEX idx_mentions_comment ON public.mentions(comment_id);
CREATE INDEX idx_mentions_user ON public.mentions(mentioned_user_id);
CREATE INDEX idx_mentions_stakeholder ON public.mentions(mentioned_stakeholder_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- Policies for comments
-- Users can see comments if they are a member of the project
CREATE POLICY "Users can view project comments" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = comments.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Users can insert comments if they are a member of the project
CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_id
            AND pm.user_id = auth.uid()
        )
        AND author_user_id = auth.uid()
    );

-- Users can edit their own comments
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (
        author_user_id = auth.uid()
    );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (
        author_user_id = auth.uid()
    );

-- Policies for mentions
CREATE POLICY "Users can view mentions in project" ON public.mentions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.comments c
            JOIN public.project_members pm ON pm.project_id = c.project_id
            WHERE c.id = mentions.comment_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create mentions" ON public.mentions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.comments c
            WHERE c.id = comment_id
            AND c.author_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete mentions" ON public.mentions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.comments c
            WHERE c.id = comment_id
            AND c.author_user_id = auth.uid()
        )
    );
