-- Migration: Sprint 8 EVM Engine

create table if not exists public.evm_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  wbs_element_id uuid references public.wbs_elements(id) on delete cascade,
  snapshot_date date not null default current_date,
  
  pv numeric(15, 2),
  ev numeric(15, 2),
  ac numeric(15, 2),
  cv numeric(15, 2),
  sv numeric(15, 2),
  cpi numeric(15, 4),
  spi numeric(15, 4),
  eac numeric(15, 2),
  etc numeric(15, 2),
  vac numeric(15, 2),
  tcpi numeric(15, 4),
  
  calculated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Unique index using coalesce for NULL wbs_element_id
create unique index evm_snapshots_unique_daily on public.evm_snapshots (project_id, coalesce(wbs_element_id, '00000000-0000-0000-0000-000000000000'), snapshot_date);

create index if not exists evm_snapshots_project_date_idx on public.evm_snapshots(project_id, snapshot_date);
create index if not exists evm_snapshots_wbs_date_idx on public.evm_snapshots(wbs_element_id, snapshot_date);

-- RLS
alter table public.evm_snapshots enable row level security;

create policy "Select evm_snapshots" on public.evm_snapshots 
for select to authenticated 
using (public.can_user_read_project_budget(project_id, auth.uid()));

create policy "Insert evm_snapshots" on public.evm_snapshots 
for insert to authenticated 
with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update evm_snapshots today only" on public.evm_snapshots 
for update to authenticated 
using (
  snapshot_date = current_date and 
  public.can_user_write_project_wbs(project_id, auth.uid())
)
with check (
  snapshot_date = current_date and 
  public.can_user_write_project_wbs(project_id, auth.uid())
);


-- Functions for EVM
create or replace function public.calculate_wbs_evm(p_wbs_id uuid, p_date date default current_date)
returns void
language plpgsql
security definer
as $$
declare
  v_project_id uuid;
  v_pv numeric(15,2) := 0;
  v_ev numeric(15,2) := 0;
  v_ac numeric(15,2) := 0;
  v_cv numeric(15,2);
  v_sv numeric(15,2);
  v_cpi numeric(15,4);
  v_spi numeric(15,4);
  v_eac numeric(15,2);
  v_etc numeric(15,2);
  v_vac numeric(15,2);
  v_tcpi numeric(15,4);
  v_budget_at_completion numeric(15,2) := 0;
  v_latest_baseline_id uuid;
  v_percent_complete numeric;
begin
  -- 1. Get Project ID & Activity percent complete
  select w.project_id, coalesce(a.percent_complete, 0)
  into v_project_id, v_percent_complete
  from public.wbs_elements w
  left join public.activities a on a.wbs_element_id = w.id
  where w.id = p_wbs_id;
  
  if v_project_id is null then return; end if;

  -- 2. AC (Actual Cost)
  select coalesce(sum(amount), 0) into v_ac
  from public.actual_costs
  where wbs_element_id = p_wbs_id and date <= p_date;

  -- 3. PV & BAC (from Baseline)
  select id into v_latest_baseline_id
  from public.budget_baselines
  where project_id = v_project_id
  order by saved_at desc
  limit 1;

  if v_latest_baseline_id is not null then
    select coalesce(baseline_total, 0) into v_budget_at_completion
    from public.baseline_cost_snapshots
    where baseline_id = v_latest_baseline_id and wbs_element_id = p_wbs_id;
    
    select coalesce(sum((phase->>'planned_amount')::numeric), 0)
    into v_pv
    from public.baseline_cost_snapshots bcs,
         jsonb_array_elements(bcs.baseline_time_phase) as phase
    where bcs.baseline_id = v_latest_baseline_id 
      and bcs.wbs_element_id = p_wbs_id
      and (phase->>'period_end_date')::date <= p_date;
  end if;

  v_pv := coalesce(v_pv, 0);
  v_budget_at_completion := coalesce(v_budget_at_completion, 0);

  -- 4. EV (Earned Value)
  v_ev := v_budget_at_completion * (v_percent_complete / 100.0);

  -- 5. Variances
  v_cv := v_ev - v_ac;
  v_sv := v_ev - v_pv;

  -- 6. Indexes
  if v_ac > 0 then v_cpi := v_ev / v_ac; else v_cpi := null; end if;
  if v_pv > 0 then v_spi := v_ev / v_pv; else v_spi := null; end if;

  -- 7. Forecasting
  if v_cpi is not null and v_cpi > 0 then
    v_eac := v_ac + ((v_budget_at_completion - v_ev) / v_cpi);
  else
    v_eac := null;
  end if;

  if v_eac is not null then
    v_etc := v_eac - v_ac;
    v_vac := v_budget_at_completion - v_eac;
  else
    v_etc := null;
    v_vac := null;
  end if;

  if (v_budget_at_completion - v_ac) > 0 then
    v_tcpi := (v_budget_at_completion - v_ev) / (v_budget_at_completion - v_ac);
  else
    v_tcpi := null;
  end if;

  -- 8. Upsert Snapshot
  insert into public.evm_snapshots (
    project_id, wbs_element_id, snapshot_date,
    pv, ev, ac, cv, sv, cpi, spi, eac, etc, vac, tcpi, calculated_at
  ) values (
    v_project_id, p_wbs_id, p_date,
    v_pv, v_ev, v_ac, v_cv, v_sv, v_cpi, v_spi, v_eac, v_etc, v_vac, v_tcpi, now()
  )
  on conflict (project_id, coalesce(wbs_element_id, '00000000-0000-0000-0000-000000000000'), snapshot_date) do update set
    pv = EXCLUDED.pv,
    ev = EXCLUDED.ev,
    ac = EXCLUDED.ac,
    cv = EXCLUDED.cv,
    sv = EXCLUDED.sv,
    cpi = EXCLUDED.cpi,
    spi = EXCLUDED.spi,
    eac = EXCLUDED.eac,
    etc = EXCLUDED.etc,
    vac = EXCLUDED.vac,
    tcpi = EXCLUDED.tcpi,
    calculated_at = EXCLUDED.calculated_at;

end;
$$;


create or replace function public.roll_up_project_evm(p_project_id uuid, p_date date default current_date)
returns void
language plpgsql
security definer
as $$
declare
  v_pv numeric(15,2);
  v_ev numeric(15,2);
  v_ac numeric(15,2);
  v_cv numeric(15,2);
  v_sv numeric(15,2);
  v_cpi numeric(15,4);
  v_spi numeric(15,4);
  v_eac numeric(15,2);
  v_etc numeric(15,2);
  v_vac numeric(15,2);
  v_tcpi numeric(15,4);
  v_budget_at_completion numeric(15,2) := 0;
  v_latest_baseline_id uuid;
begin
  select sum(pv), sum(ev), sum(ac)
  into v_pv, v_ev, v_ac
  from public.evm_snapshots
  where project_id = p_project_id 
    and wbs_element_id is not null 
    and snapshot_date = p_date;

  v_pv := coalesce(v_pv, 0);
  v_ev := coalesce(v_ev, 0);
  v_ac := coalesce(v_ac, 0);

  v_cv := v_ev - v_ac;
  v_sv := v_ev - v_pv;

  if v_ac > 0 then v_cpi := v_ev / v_ac; else v_cpi := null; end if;
  if v_pv > 0 then v_spi := v_ev / v_pv; else v_spi := null; end if;

  select id into v_latest_baseline_id
  from public.budget_baselines
  where project_id = p_project_id
  order by saved_at desc
  limit 1;

  if v_latest_baseline_id is not null then
    select sum(baseline_total) into v_budget_at_completion
    from public.baseline_cost_snapshots
    where baseline_id = v_latest_baseline_id;
  end if;

  v_budget_at_completion := coalesce(v_budget_at_completion, 0);

  if v_cpi is not null and v_cpi > 0 then
    v_eac := v_ac + ((v_budget_at_completion - v_ev) / v_cpi);
  else
    v_eac := null;
  end if;

  if v_eac is not null then
    v_etc := v_eac - v_ac;
    v_vac := v_budget_at_completion - v_eac;
  else
    v_etc := null;
    v_vac := null;
  end if;

  if (v_budget_at_completion - v_ac) > 0 then
    v_tcpi := (v_budget_at_completion - v_ev) / (v_budget_at_completion - v_ac);
  else
    v_tcpi := null;
  end if;

  insert into public.evm_snapshots (
    project_id, wbs_element_id, snapshot_date,
    pv, ev, ac, cv, sv, cpi, spi, eac, etc, vac, tcpi, calculated_at
  ) values (
    p_project_id, null, p_date,
    v_pv, v_ev, v_ac, v_cv, v_sv, v_cpi, v_spi, v_eac, v_etc, v_vac, v_tcpi, now()
  )
  on conflict (project_id, coalesce(wbs_element_id, '00000000-0000-0000-0000-000000000000'), snapshot_date) do update set
    pv = EXCLUDED.pv,
    ev = EXCLUDED.ev,
    ac = EXCLUDED.ac,
    cv = EXCLUDED.cv,
    sv = EXCLUDED.sv,
    cpi = EXCLUDED.cpi,
    spi = EXCLUDED.spi,
    eac = EXCLUDED.eac,
    etc = EXCLUDED.etc,
    vac = EXCLUDED.vac,
    tcpi = EXCLUDED.tcpi,
    calculated_at = EXCLUDED.calculated_at;

end;
$$;

-- Trigger Functions
create or replace function public.trigger_evm_calc_on_actual_cost()
returns trigger
language plpgsql
security definer
as $$
declare
  v_project_id uuid;
begin
  select project_id into v_project_id from public.wbs_elements where id = coalesce(NEW.wbs_element_id, OLD.wbs_element_id);
  if v_project_id is not null then
    perform public.calculate_wbs_evm(coalesce(NEW.wbs_element_id, OLD.wbs_element_id));
    perform public.roll_up_project_evm(v_project_id);
  end if;
  return null;
end;
$$;

create trigger evm_actual_costs_trigger
after insert or update or delete on public.actual_costs
for each row execute function public.trigger_evm_calc_on_actual_cost();


create or replace function public.trigger_evm_calc_on_activity_progress()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.percent_complete is distinct from OLD.percent_complete then
    perform public.calculate_wbs_evm(NEW.wbs_element_id);
    perform public.roll_up_project_evm(NEW.project_id);
  end if;
  return null;
end;
$$;

create trigger evm_activity_progress_trigger
after update of percent_complete on public.activities
for each row execute function public.trigger_evm_calc_on_activity_progress();


create or replace function public.trigger_evm_calc_on_baseline()
returns trigger
language plpgsql
security definer
as $$
declare
  wbs record;
begin
  for wbs in select id from public.wbs_elements where project_id = NEW.project_id loop
    perform public.calculate_wbs_evm(wbs.id);
  end loop;
  perform public.roll_up_project_evm(NEW.project_id);
  return null;
end;
$$;

create trigger evm_baseline_trigger
after insert on public.budget_baselines
for each row execute function public.trigger_evm_calc_on_baseline();
