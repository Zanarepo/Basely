-- Fix RLS policies for product_backlog_items
DROP POLICY IF EXISTS "Users can view backlog items in their projects" ON public.product_backlog_items;
DROP POLICY IF EXISTS "Users can manage backlog items in their projects" ON public.product_backlog_items;
DROP POLICY IF EXISTS "Users can insert backlog items in their projects" ON public.product_backlog_items;
DROP POLICY IF EXISTS "Users can update backlog items in their projects" ON public.product_backlog_items;
DROP POLICY IF EXISTS "Users can delete backlog items in their projects" ON public.product_backlog_items;

CREATE POLICY "Users can view backlog items in their projects"
    ON public.product_backlog_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert backlog items in their projects"
    ON public.product_backlog_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update backlog items in their projects"
    ON public.product_backlog_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete backlog items in their projects"
    ON public.product_backlog_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = product_backlog_items.organization_id
            AND om.user_id = auth.uid()
        )
    );
