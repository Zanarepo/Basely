-- Migration: WBS Dictionary & RACI Matrix Templates
-- Version: 20260721030000_wbs_raci_templates

-- Insert WBS Dictionary template
insert into public.document_templates (document_type, section_definitions)
values (
  'wbs_dictionary',
  '[
    {
      "id": "wbs-data",
      "title": "WBS Elements & Work Packages",
      "type": "data_bound",
      "source": "wbs.dictionary",
      "help_text": "This section automatically pulls all Work Packages, their descriptions, deliverables, acceptance criteria, and Accountable owners."
    }
  ]'::jsonb
)
on conflict (document_type) do nothing;

-- Insert RACI Matrix template
insert into public.document_templates (document_type, section_definitions)
values (
  'raci',
  '[
    {
      "id": "raci-grid",
      "title": "RACI Matrix Assignments",
      "type": "data_bound",
      "source": "raci.matrix",
      "help_text": "This grid automatically plots your Work Packages against your Stakeholders, flagging any unassigned work."
    }
  ]'::jsonb
)
on conflict (document_type) do nothing;
