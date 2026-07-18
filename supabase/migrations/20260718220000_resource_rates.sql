-- Migration: Resource Rates & Assignments
-- Version: 20260718220000_resource_rates

-- 1. Create Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'resource_type') then
    create type public.resource_type as enum ('labor', 'material', 'fixed');
  end if;
  if not exists (select 1 from pg_type where typname = 'resource_unit') then
    create type public.resource_unit as enum ('hr', 'day', 'unit', 'flat');
  end if;
end
$$;

-- 2. Add global overhead to projects
alter table public.projects 
add column if not exists global_overhead_percentage numeric(5,2) not null default 0.00;

-- 3. Create Resource Rates Table
create table if not exists public.resource_rates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type public.resource_type not null default 'labor',
  rate numeric(14,2) not null default 0.00,
  unit public.resource_unit not null default 'hr',
  currency text not null default 'USD',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists resource_rates_project_idx on public.resource_rates(project_id);

-- 4. Create Activity Resource Assignments Table
-- Note: 'activity' in this context maps directly to a WBS element that is a work package.
create table if not exists public.activity_resource_assignments (
  id uuid primary key default gen_random_uuid(),
  wbs_element_id uuid not null references public.wbs_elements(id) on delete cascade,
  resource_rate_id uuid not null references public.resource_rates(id) on delete restrict,
  quantity numeric(14,2) not null default 0.00,
  calculated_cost numeric(14,2) not null default 0.00,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists activity_resource_assignments_wbs_idx on public.activity_resource_assignments(wbs_element_id);

-- 5. Trigger to Auto-Calculate Cost per assignment
create or replace function public.calculate_assignment_cost()
returns trigger
language plpgsql
as $$
declare
  v_rate numeric;
begin
  -- Fetch the resource rate
  select rate into v_rate from public.resource_rates where id = NEW.resource_rate_id;
  
  -- Calculate cost: rate * quantity
  NEW.calculated_cost := v_rate * NEW.quantity;
  NEW.updated_at := timezone('utc'::text, now());
  
  return NEW;
end;
$$;

drop trigger if exists trigger_calculate_assignment_cost on public.activity_resource_assignments;
create trigger trigger_calculate_assignment_cost
before insert or update on public.activity_resource_assignments
for each row execute function public.calculate_assignment_cost();


-- 6. Trigger to Update Resource Calculated Total in Cost Accounts
-- Note: This rolls up the assignment costs into the cost account but does NOT overwrite the budgeted_total.
-- It will be used for variance detection in the UI. We will add a 'resource_calculated_total' column to cost_accounts.

alter table public.cost_accounts
add column if not exists resource_calculated_total numeric(14,2) not null default 0.00;

create or replace function public.rollup_assignment_costs_to_account()
returns trigger
language plpgsql
as $$
declare
  v_wbs_element_id uuid;
  v_total numeric := 0;
  v_overhead numeric := 0;
begin
  -- Determine the affected WBS Element ID
  if TG_OP = 'DELETE' then
    v_wbs_element_id := OLD.wbs_element_id;
  else
    v_wbs_element_id := NEW.wbs_element_id;
  end if;

  -- Get Overhead from project
  select global_overhead_percentage into v_overhead 
  from public.projects p
  join public.wbs_elements w on w.project_id = p.id
  where w.id = v_wbs_element_id;

  -- Sum all assignment costs for this WBS element
  select coalesce(sum(calculated_cost), 0) into v_total
  from public.activity_resource_assignments
  where wbs_element_id = v_wbs_element_id;

  -- Apply overhead
  v_total := v_total + (v_total * (v_overhead / 100));

  -- Update the cost account's resource_calculated_total
  update public.cost_accounts
  set resource_calculated_total = v_total,
      updated_at = timezone('utc'::text, now())
  where wbs_element_id = v_wbs_element_id;

  return null;
end;
$$;

drop trigger if exists trigger_rollup_assignment_costs on public.activity_resource_assignments;
create trigger trigger_rollup_assignment_costs
after insert or update or delete on public.activity_resource_assignments
for each row execute function public.rollup_assignment_costs_to_account();

-- Also need a trigger on resource_rates to recalculate assignments if the rate changes
create or replace function public.recalculate_assignments_on_rate_change()
returns trigger
language plpgsql
as $$
begin
  if NEW.rate <> OLD.rate then
    -- Force an update on all assignments using this rate, which will fire trigger_calculate_assignment_cost
    update public.activity_resource_assignments
    set updated_at = timezone('utc'::text, now())
    where resource_rate_id = NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_recalculate_assignments on public.resource_rates;
create trigger trigger_recalculate_assignments
after update on public.resource_rates
for each row execute function public.recalculate_assignments_on_rate_change();


-- 7. Row Level Security Policies
alter table public.resource_rates enable row level security;
alter table public.activity_resource_assignments enable row level security;

-- resource_rates
create policy "Select resource_rates" on public.resource_rates for select to authenticated using (public.can_user_read_project_budget(project_id, auth.uid()));
create policy "Insert resource_rates" on public.resource_rates for insert to authenticated with check (public.can_user_write_project_wbs(project_id, auth.uid()));
create policy "Update resource_rates" on public.resource_rates for update to authenticated using (public.can_user_write_project_wbs(project_id, auth.uid())) with check (public.can_user_write_project_wbs(project_id, auth.uid()));
create policy "Delete resource_rates" on public.resource_rates for delete to authenticated using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- activity_resource_assignments
create policy "Select activity_resource_assignments" on public.activity_resource_assignments for select to authenticated using (
  public.can_user_read_project_budget((select project_id from public.wbs_elements where id = activity_resource_assignments.wbs_element_id), auth.uid())
);
create policy "Insert activity_resource_assignments" on public.activity_resource_assignments for insert to authenticated with check (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
);
create policy "Update activity_resource_assignments" on public.activity_resource_assignments for update to authenticated using (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
) with check (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
);
create policy "Delete activity_resource_assignments" on public.activity_resource_assignments for delete to authenticated using (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
);
