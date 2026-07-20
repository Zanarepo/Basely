-- Migration: Status Report Generator
-- Version: 20260721040000_status_report

-- 1. Insert Status Report template
insert into public.document_templates (document_type, section_definitions)
values (
  'status_report',
  '[
    {"key": "schedule_status", "title": "Schedule Status", "type": "data_bound", "source": "status.schedule"},
    {"key": "cost_status", "title": "Cost & EVM Status", "type": "data_bound", "source": "status.cost"},
    {"key": "top_risks", "title": "Top Risks", "type": "data_bound", "source": "status.risks"},
    {"key": "narrative_summary", "title": "Narrative Summary", "type": "free_text"},
    {"key": "accomplishments", "title": "Accomplishments this period", "type": "free_text"},
    {"key": "planned_focus", "title": "Planned focus for next period", "type": "free_text"}
  ]'::jsonb
) on conflict (document_type) do nothing;

-- 2. Modify generated_documents table for historical snapshots
alter table public.generated_documents 
  add column if not exists frozen_data jsonb default '{}'::jsonb,
  add column if not exists period_end date;

-- 3. Drop the restrictive unique constraint safely
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.generated_documents'::regclass 
          AND contype = 'u'
    LOOP
        EXECUTE 'ALTER TABLE public.generated_documents DROP CONSTRAINT ' || quote_ident(rec.conname);
    END LOOP;
END $$;

-- 4. Add partial unique index for drafts only
create unique index if not exists generated_documents_draft_idx 
  on public.generated_documents (project_id, document_type) 
  where is_snapshot = false;
