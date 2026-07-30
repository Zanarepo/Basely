-- Migration to add release_id to deliverable_signoffs (Sprint 47)
-- This allows UAT Sign-offs to be scoped to a release instead of just a WBS element.

ALTER TABLE deliverable_signoffs
ADD COLUMN release_id UUID REFERENCES releases(id) ON DELETE CASCADE;

-- Ensure that either wbs_element_id or release_id is present (or we can just leave them nullable).
-- We'll just leave it nullable as per the current schema for wbs_element_id.

-- Update RLS policies for deliverable_signoffs to account for release_id

-- 1. Read access
CREATE POLICY "Users can read signoffs for projects they have access to via release"
    ON deliverable_signoffs
    FOR SELECT
    USING (
        release_id IN (
            SELECT id FROM releases WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- 2. Insert access
CREATE POLICY "Users can insert signoffs for projects they have access to via release"
    ON deliverable_signoffs
    FOR INSERT
    WITH CHECK (
        release_id IN (
            SELECT id FROM releases WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- 3. Update access
CREATE POLICY "Users can update signoffs for projects they have access to via release"
    ON deliverable_signoffs
    FOR UPDATE
    USING (
        release_id IN (
            SELECT id FROM releases WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

-- 4. Delete access
CREATE POLICY "Users can delete signoffs for projects they have access to via release"
    ON deliverable_signoffs
    FOR DELETE
    USING (
        release_id IN (
            SELECT id FROM releases WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );
