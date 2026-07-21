-- Fix Comments RLS policies to match project select permissions

-- Drop the old flawed policies
DROP POLICY IF EXISTS "Users can view project comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;

-- Recreate policies using EXISTS on projects table (which automatically checks project RLS)
CREATE POLICY "Users can view project comments" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = comments.project_id
        )
    );

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id
        )
        AND author_user_id = auth.uid()
    );
