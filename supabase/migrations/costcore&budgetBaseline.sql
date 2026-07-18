-- Migration: Cost Core & Budget Baseline Schema
do $$
begin
  if not exists (select 1 from pg_type where typname = 'estimation_method_type') then
    create type public.estimation_method_type as enum ('analogous', 'parametric', 'bottom_up');
  end if;
end
$$;

alter table public.projects 
add column if not exists contingency_amount numeric(14,2) not null default 0.00;

create table if not exists public.cost_accounts (
  id uuid primary key default gen_random_uuid(),
  wbs_element_id uuid not null references public.wbs_elements(id) on delete cascade,
  estimation_method public.estimation_method_type not null default 'bottom_up',
  budgeted_total numeric(14,2) not null default 0.00,
  rate numeric(14,2),
  quantity numeric(14,2),
  analogous_reference_note text,
  currency text not null default 'USD',
  reconciliation_status text not null default 'pending',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create or replace function public.check_wbs_is_work_package()
returns trigger
language plpgsql
as $$
declare
  v_is_wp boolean;
begin
  select is_work_package into v_is_wp from public.wbs_elements where id = NEW.wbs_element_id;
  if not v_is_wp then
    raise exception 'Cost accounts can only be attached to WBS elements that are flagged as work packages.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists enforce_cost_account_work_package on public.cost_accounts;
create trigger enforce_cost_account_work_package
before insert or update on public.cost_accounts
for each row execute function public.check_wbs_is_work_package();

create table if not exists public.time_phase_entries (
  id uuid primary key default gen_random_uuid(),
  cost_account_id uuid not null references public.cost_accounts(id) on delete cascade,
  period_start_date date not null,
  period_end_date date not null,
  planned_amount numeric(14,2) not null default 0.00,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists time_phase_entries_cost_account_idx on public.time_phase_entries(cost_account_id);

create table if not exists public.budget_baselines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  saved_at timestamp with time zone not null default timezone('utc'::text, now()),
  created_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.baseline_cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  baseline_id uuid not null references public.budget_baselines(id) on delete cascade,
  wbs_element_id uuid not null,
  snapshotted_wbs_name text not null,
  snapshotted_parent_id uuid,
  baseline_total numeric(14,2) not null default 0.00,
  exchange_rate_at_snapshot numeric(14,6) default 1.000000,
  baseline_time_phase jsonb not null default '[]'::jsonb
);

create index if not exists baseline_cost_snapshots_baseline_idx on public.baseline_cost_snapshots(baseline_id);


-- Migration: Cost Core RLS Policies
create or replace function public.can_user_read_project_budget(p_project_id uuid, p_user_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_org_id uuid;
  v_created_by uuid;
  v_role public.user_role;
begin
  select organization_id, created_by 
  into v_org_id, v_created_by 
  from public.projects where id = p_project_id;
  
  if v_org_id is null then return false; end if;
  if v_created_by = p_user_id then return true; end if;
  if public.is_workspace_owner(v_org_id, p_user_id) then return true; end if;
  
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  if v_role in ('Admin'::public.user_role, 'PM'::public.user_role) then
    return true;
  end if;
  return false;
end;
$$;

alter table public.cost_accounts enable row level security;
alter table public.time_phase_entries enable row level security;
alter table public.budget_baselines enable row level security;
alter table public.baseline_cost_snapshots enable row level security;

create policy "Select cost_accounts" on public.cost_accounts for select to authenticated using (public.can_user_read_project_budget((select project_id from public.wbs_elements where id = cost_accounts.wbs_element_id), auth.uid()));
create policy "Insert cost_accounts" on public.cost_accounts for insert to authenticated with check (public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid()));
create policy "Update cost_accounts" on public.cost_accounts for update to authenticated using (public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())) with check (public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid()));
create policy "Delete cost_accounts" on public.cost_accounts for delete to authenticated using (public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid()));

create policy "Select time_phase_entries" on public.time_phase_entries for select to authenticated using (public.can_user_read_project_budget((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = time_phase_entries.cost_account_id), auth.uid()));
create policy "Insert time_phase_entries" on public.time_phase_entries for insert to authenticated with check (public.can_user_write_project_wbs((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid()));
create policy "Update time_phase_entries" on public.time_phase_entries for update to authenticated using (public.can_user_write_project_wbs((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid())) with check (public.can_user_write_project_wbs((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid()));
create policy "Delete time_phase_entries" on public.time_phase_entries for delete to authenticated using (public.can_user_write_project_wbs((select w.project_id from public.wbs_elements w join public.cost_accounts c on c.wbs_element_id = w.id where c.id = cost_account_id), auth.uid()));

create policy "Select budget_baselines" on public.budget_baselines for select to authenticated using (public.can_user_read_project_budget(project_id, auth.uid()));
create policy "Insert budget_baselines" on public.budget_baselines for insert to authenticated with check (public.can_user_write_project_wbs(project_id, auth.uid()));
create policy "Update budget_baselines" on public.budget_baselines for update to authenticated using (public.can_user_write_project_wbs(project_id, auth.uid())) with check (public.can_user_write_project_wbs(project_id, auth.uid()));
create policy "Delete budget_baselines" on public.budget_baselines for delete to authenticated using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Select baseline_cost_snapshots" on public.baseline_cost_snapshots for select to authenticated using (public.can_user_read_project_budget((select project_id from public.budget_baselines where id = baseline_cost_snapshots.baseline_id), auth.uid()));
create policy "Insert baseline_cost_snapshots" on public.baseline_cost_snapshots for insert to authenticated with check (public.can_user_write_project_wbs((select project_id from public.budget_baselines where id = baseline_id), auth.uid()));
