-- Migration: Risk and Issue Register
-- Description: Creates the risks and issues tables with Row Level Security

-- ==========================================
-- Risks Table
-- ==========================================
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  probability integer not null check (probability between 1 and 5),
  impact integer not null check (impact between 1 and 5),
  risk_score integer generated always as (probability * impact) stored,
  response_strategy text check (response_strategy in ('Avoid', 'Mitigate', 'Transfer', 'Accept')),
  status text not null default 'Identified',
  owner_stakeholder_id uuid references public.stakeholders(id) on delete set null,
  allocated_contingency_amount numeric(14,2),
  linked_wbs_element_id uuid references public.wbs_elements(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indices for Risks
create index if not exists idx_risks_project_id on public.risks(project_id);
create index if not exists idx_risks_owner on public.risks(owner_stakeholder_id);
create index if not exists idx_risks_wbs on public.risks(linked_wbs_element_id);

-- RLS for Risks
alter table public.risks enable row level security;

create policy "Users can view risks for projects in their organization"
  on public.risks for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Users can insert risks for projects in their organization"
  on public.risks for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can update risks for projects in their organization"
  on public.risks for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can delete risks for projects in their organization"
  on public.risks for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Create a generic updated_at trigger function if it doesn't exist
create or replace function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for updated_at on Risks
create trigger handle_updated_at_risks
  before update on public.risks
  for each row
  execute function public.trigger_set_updated_at();


-- ==========================================
-- Issues Table
-- ==========================================
create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  raised_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'Open',
  owner_stakeholder_id uuid references public.stakeholders(id) on delete set null,
  linked_risk_id uuid references public.risks(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indices for Issues
create index if not exists idx_issues_project_id on public.issues(project_id);
create index if not exists idx_issues_owner on public.issues(owner_stakeholder_id);
create index if not exists idx_issues_risk on public.issues(linked_risk_id);

-- RLS for Issues
alter table public.issues enable row level security;

create policy "Users can view issues for projects in their organization"
  on public.issues for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Users can insert issues for projects in their organization"
  on public.issues for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can update issues for projects in their organization"
  on public.issues for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can delete issues for projects in their organization"
  on public.issues for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Trigger for updated_at on Issues
create trigger handle_updated_at_issues
  before update on public.issues
  for each row
  execute function public.trigger_set_updated_at();
