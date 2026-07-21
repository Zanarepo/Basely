-- Migration: Update Project Charter Template to Hybrid Free-Text First with Auto-fill Sources

update public.document_templates
set section_definitions = '[
  {"key": "executive_summary", "title": "Executive Summary", "type": "free_text"},
  {"key": "business_case", "title": "Business Case & Justification", "type": "free_text"},
  {"key": "objectives", "title": "Project Objectives", "type": "free_text"},
  {"key": "scope_statement", "title": "Scope Statement", "type": "free_text"},
  {"key": "wbs_dictionary", "title": "Key Deliverables & Work Packages", "type": "free_text", "source": "wbs.dictionary"},
  {"key": "success_criteria", "title": "Success Criteria", "type": "free_text"},
  {"key": "assumptions", "title": "Assumptions", "type": "free_text"},
  {"key": "constraints", "title": "Constraints", "type": "free_text"},
  {"key": "risks", "title": "High-Level Risks", "type": "free_text", "source": "status.risks"},
  {"key": "milestones", "title": "Milestones & Key Dates", "type": "free_text", "source": "status.schedule"},
  {"key": "organization", "title": "Project Organization & RACI", "type": "free_text", "source": "raci.matrix"},
  {"key": "approval", "title": "Sign-Off & Approval", "type": "free_text"}
]'::jsonb
where document_type = 'charter';
