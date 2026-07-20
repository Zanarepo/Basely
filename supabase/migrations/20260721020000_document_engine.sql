-- Migration: Document Templating Engine & Project Charter
-- Version: 20260721020000_document_engine

-- 1. Create document_templates table (Global templates)
create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  document_type text not null unique,
  section_definitions jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create generated_documents table (Project-scoped generated documents)
create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  document_type text not null,
  free_text_content jsonb not null default '{}'::jsonb,
  is_snapshot boolean not null default false,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, document_type, is_snapshot)
);

-- 3. Enable RLS
alter table public.document_templates enable row level security;
alter table public.generated_documents enable row level security;

-- 4. RLS Policies for document_templates (Global Read-Only for authenticated)
create policy "Anyone can read document templates"
  on public.document_templates for select
  using (auth.role() = 'authenticated');

-- 5. RLS Policies for generated_documents (Project-scoped)
create policy "Users can read generated documents for accessible projects"
  on public.generated_documents for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Users can manage generated documents for accessible projects"
  on public.generated_documents for all
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- 6. Insert initial Charter template
insert into public.document_templates (document_type, section_definitions)
values (
  'charter',
  '[
    {"key": "project_name", "title": "Project Name", "type": "data_bound", "source": "project.name"},
    {"key": "client_name", "title": "Client Name", "type": "data_bound", "source": "project.client_name"},
    {"key": "start_date", "title": "Target Start Date", "type": "data_bound", "source": "project.start_date"},
    {"key": "end_date", "title": "Target Finish Date", "type": "data_bound", "source": "project.end_date"},
    {"key": "currency", "title": "Primary Currency", "type": "data_bound", "source": "project.currency"},
    {"key": "methodology", "title": "Methodology", "type": "data_bound", "source": "project.methodology"},
    {"key": "business_case", "title": "Business Case & Justification", "type": "free_text"},
    {"key": "objectives", "title": "High-Level Objectives", "type": "free_text"},
    {"key": "assumptions", "title": "Assumptions & Constraints", "type": "free_text"},
    {"key": "wbs_prototype", "title": "WBS Elements (Prototype)", "type": "data_bound", "source": "wbs.prototype"}
  ]'::jsonb
) on conflict (document_type) do nothing;
