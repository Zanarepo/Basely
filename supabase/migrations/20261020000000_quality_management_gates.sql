-- Migration: Quality Management Gates & Signoffs
-- Version: 20261020000000_quality_management_gates

create table if not exists public.wbs_quality_signoffs (
  id uuid primary key default gen_random_uuid(),
  wbs_element_id uuid references public.wbs_elements(id) on delete cascade not null,
  signed_off_by uuid references auth.users(id) not null,
  signed_off_at timestamp with time zone default timezone('utc'::text, now()) not null,
  checks_status jsonb not null default '[]'::jsonb,
  unique(wbs_element_id)
);

alter table public.wbs_quality_signoffs enable row level security;

create policy "Users can read quality signoffs for accessible projects"
  on public.wbs_quality_signoffs for select
  using (
    exists (
      select 1 from public.wbs_elements
      where wbs_elements.id = wbs_quality_signoffs.wbs_element_id
      and public.can_user_read_project(wbs_elements.project_id, auth.uid())
    )
  );

create policy "Users can manage quality signoffs for accessible projects"
  on public.wbs_quality_signoffs for all
  using (
    exists (
      select 1 from public.wbs_elements
      where wbs_elements.id = wbs_quality_signoffs.wbs_element_id
      and public.can_user_write_project_wbs(wbs_elements.project_id, auth.uid())
    )
  );
