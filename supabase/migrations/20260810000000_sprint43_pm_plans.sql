-- Migration: Sprint 43 Project Management Plan & Change Management Plan Schema
-- Description: Creates change_management_plans and project_management_plan_links tables with Row Level Security

-- ==========================================
-- Change Management Plans Table
-- ==========================================
create table if not exists public.change_management_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  approval_thresholds text not null default 'Scope changes over $5,000 or schedule delays over 3 business days require Executive Sponsor sign-off. Changes within baseline tolerances may be approved by the Project Manager.',
  escalation_process text not null default '1. Initial review by Project Manager within 48 hours.\n2. Escalation to Change Control Board (CCB) for items exceeding threshold.\n3. Final determination by Executive Sponsor within 5 business days.',
  roles_description text not null default '• Project Manager: Evaluates technical and schedule impacts.\n• Change Control Board (CCB): Gating body for baseline modifications.\n• Executive Sponsor: Final authority on budget reserve additions.',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id)
);

-- Indices for Change Management Plans
create index if not exists idx_change_mgmt_plans_project_id on public.change_management_plans(project_id);

-- RLS for Change Management Plans
alter table public.change_management_plans enable row level security;

create policy "Users can view change management plans for projects in their organization"
  on public.change_management_plans for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Users can insert change management plans for projects in their organization"
  on public.change_management_plans for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can update change management plans for projects in their organization"
  on public.change_management_plans for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can delete change management plans for projects in their organization"
  on public.change_management_plans for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Trigger for updated_at on change_management_plans
create trigger handle_updated_at_change_management_plans
  before update on public.change_management_plans
  for each row
  execute function public.trigger_set_updated_at();


-- ==========================================
-- Project Management Plan Links Table
-- ==========================================
create table if not exists public.project_management_plan_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sub_plan_type text not null check (sub_plan_type in (
    'scope_statement',
    'schedule_document',
    'budget_baseline',
    'risk_register',
    'communication_plan',
    'raci',
    'quality_management_plan',
    'procurement_plan',
    'change_management_plan'
  )),
  linked_document_id uuid,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, sub_plan_type)
);

-- Indices for PM Plan Links
create index if not exists idx_pm_plan_links_project_id on public.project_management_plan_links(project_id);

-- RLS for PM Plan Links
alter table public.project_management_plan_links enable row level security;

create policy "Users can view PM plan links for projects in their organization"
  on public.project_management_plan_links for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Users can insert PM plan links for projects in their organization"
  on public.project_management_plan_links for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can update PM plan links for projects in their organization"
  on public.project_management_plan_links for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Users can delete PM plan links for projects in their organization"
  on public.project_management_plan_links for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Trigger for updated_at on project_management_plan_links
create trigger handle_updated_at_pm_plan_links
  before update on public.project_management_plan_links
  for each row
  execute function public.trigger_set_updated_at();
