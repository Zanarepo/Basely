-- Migration: Actual Costs
-- Version: 20260718240000_actual_costs

-- 1. Create source enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'actual_cost_source') then
    create type public.actual_cost_source as enum ('manual', 'import', 'api');
  end if;
end
$$;

-- 2. Create Actual Costs Table
create table if not exists public.actual_costs (
  id uuid primary key default gen_random_uuid(),
  wbs_element_id uuid not null references public.wbs_elements(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  resource_rate_id uuid references public.resource_rates(id) on delete set null,
  amount numeric(15, 2) not null default 0.00,
  currency text not null default 'USD',
  date date not null default current_date,
  description text,
  source public.actual_cost_source not null default 'manual',
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists actual_costs_wbs_idx on public.actual_costs(wbs_element_id);
create index if not exists actual_costs_date_idx on public.actual_costs(date);

-- 3. Row Level Security Policies
alter table public.actual_costs enable row level security;

create policy "Select actual_costs" on public.actual_costs for select to authenticated using (
  public.can_user_read_project_budget((select project_id from public.wbs_elements where id = actual_costs.wbs_element_id), auth.uid())
);
create policy "Insert actual_costs" on public.actual_costs for insert to authenticated with check (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
);
create policy "Update actual_costs" on public.actual_costs for update to authenticated using (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
) with check (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
);
create policy "Delete actual_costs" on public.actual_costs for delete to authenticated using (
  public.can_user_write_project_wbs((select project_id from public.wbs_elements where id = wbs_element_id), auth.uid())
);
