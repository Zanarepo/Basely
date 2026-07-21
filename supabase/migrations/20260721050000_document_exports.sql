-- Migration: Document Exports & Unified History
-- Version: 20260721050000_document_exports

-- 1. Create document_exports table
create table if not exists public.document_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  generated_document_id uuid references public.generated_documents(id) on delete set null,
  document_type text not null,
  format text not null check (format in ('pdf', 'docx', 'xlsx')),
  file_name text not null,
  file_content text, -- Stored Base64 encoded exported file content for exact-content retrieval
  content_snapshot jsonb not null default '{}'::jsonb,
  exported_at timestamp with time zone default timezone('utc'::text, now()) not null,
  exported_by uuid references public.profiles(id) on delete set null
);

-- 2. Indexes for fast history queries
create index if not exists document_exports_project_idx on public.document_exports(project_id, exported_at desc);
create index if not exists document_exports_type_idx on public.document_exports(project_id, document_type, exported_at desc);

-- 3. Enable RLS
alter table public.document_exports enable row level security;

-- 4. RLS Policies
create policy "Users can read document exports for accessible projects"
  on public.document_exports for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Users can insert document exports for accessible projects"
  on public.document_exports for insert
  with check (public.can_user_read_project(project_id, auth.uid()));

create policy "Users can delete document exports for accessible projects"
  on public.document_exports for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));
