-- Migration: Add structured change thresholds
-- Description: Adds cr_cost_threshold and cr_schedule_threshold_days to change_management_plans

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='change_management_plans' and column_name='cr_cost_threshold') then
    alter table public.change_management_plans add column cr_cost_threshold numeric not null default 5000;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='change_management_plans' and column_name='cr_schedule_threshold_days') then
    alter table public.change_management_plans add column cr_schedule_threshold_days numeric not null default 3;
  end if;
end
$$;
