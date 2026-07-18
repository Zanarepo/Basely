-- Migration: Scheduling & Critical Path Method (CPM) Engine Data Model
-- Version: 20260718000000_schedule_cpm

-- 1. Create enum types if not exists
do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum ('Task', 'Milestone', 'Summary');
  end if;
  if not exists (select 1 from pg_type where typname = 'constraint_type') then
    create type public.constraint_type as enum ('ASAP', 'Must Start On', 'Must Finish On', 'Start No Earlier Than', 'Finish No Later Than');
  end if;
  if not exists (select 1 from pg_type where typname = 'dependency_type') then
    create type public.dependency_type as enum ('FS', 'SS', 'FF', 'SF');
  end if;
end
$$;

-- 2. Create the calendars table
create table if not exists public.project_calendars (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  working_days integer[] not null default '{1,2,3,4,5}'::integer[],
  holidays date[] not null default '{}'::date[],
  is_default boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure only one default calendar per project
create unique index if not exists unique_default_project_calendar_idx 
  on public.project_calendars(project_id) 
  where (is_default = true);

-- 3. Create the activities table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  wbs_element_id uuid references public.wbs_elements(id) on delete cascade not null unique,
  name text not null,
  type public.activity_type not null default 'Task'::public.activity_type,
  duration numeric not null default 1 check (duration >= 0),
  percent_complete numeric not null default 0 check (percent_complete >= 0 and percent_complete <= 100),
  constraint_type public.constraint_type not null default 'ASAP'::public.constraint_type,
  constraint_date date,
  es date,
  ef date,
  ls date,
  lf date,
  total_float numeric,
  free_float numeric,
  is_critical boolean not null default false,
  calendar_id uuid references public.project_calendars(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for project scopes
create index if not exists activities_project_idx on public.activities(project_id);

-- 4. Create the dependencies table
create table if not exists public.dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  predecessor_id uuid references public.activities(id) on delete cascade not null,
  successor_id uuid references public.activities(id) on delete cascade not null,
  type public.dependency_type not null default 'FS'::public.dependency_type,
  lag_days numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_dependency unique (predecessor_id, successor_id),
  constraint no_self_dependency check (predecessor_id <> successor_id)
);

create index if not exists dependencies_project_idx on public.dependencies(project_id);

-- 5. Create Baselines tables
create table if not exists public.baselines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  saved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_project_baseline_name unique (project_id, name)
);

create table if not exists public.baseline_activity_snapshots (
  id uuid primary key default gen_random_uuid(),
  baseline_id uuid references public.baselines(id) on delete cascade not null,
  activity_id uuid references public.activities(id) on delete cascade not null,
  baseline_start date,
  baseline_finish date,
  baseline_duration numeric,
  constraint unique_baseline_activity unique (baseline_id, activity_id)
);

-- =========================================================================
-- 6. ENABLE ROW-LEVEL SECURITY
-- =========================================================================
alter table public.project_calendars enable row level security;
alter table public.activities enable row level security;
alter table public.dependencies enable row level security;
alter table public.baselines enable row level security;
alter table public.baseline_activity_snapshots enable row level security;

-- Policies for project_calendars
create policy "Select project_calendars"
  on public.project_calendars for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Insert project_calendars"
  on public.project_calendars for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update project_calendars"
  on public.project_calendars for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Delete project_calendars"
  on public.project_calendars for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Policies for activities
create policy "Select activities"
  on public.activities for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Insert activities"
  on public.activities for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update activities"
  on public.activities for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Delete activities"
  on public.activities for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Policies for dependencies
create policy "Select dependencies"
  on public.dependencies for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Insert dependencies"
  on public.dependencies for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update dependencies"
  on public.dependencies for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Delete dependencies"
  on public.dependencies for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Policies for baselines
create policy "Select baselines"
  on public.baselines for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Insert baselines"
  on public.baselines for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update baselines"
  on public.baselines for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Delete baselines"
  on public.baselines for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Policies for baseline_activity_snapshots (joined via baselines RLS check)
create policy "Select baseline snapshots"
  on public.baseline_activity_snapshots for select
  using (
    exists (
      select 1 from public.baselines b
      where b.id = baseline_id and public.can_user_read_project(b.project_id, auth.uid())
    )
  );

create policy "Insert baseline snapshots"
  on public.baseline_activity_snapshots for insert
  with check (
    exists (
      select 1 from public.baselines b
      where b.id = baseline_id and public.can_user_write_project_wbs(b.project_id, auth.uid())
    )
  );

create policy "Update baseline snapshots"
  on public.baseline_activity_snapshots for update
  using (
    exists (
      select 1 from public.baselines b
      where b.id = baseline_id and public.can_user_write_project_wbs(b.project_id, auth.uid())
    )
  );

create policy "Delete baseline snapshots"
  on public.baseline_activity_snapshots for delete
  using (
    exists (
      select 1 from public.baselines b
      where b.id = baseline_id and public.can_user_write_project_wbs(b.project_id, auth.uid())
    )
  );

-- =========================================================================
-- 7. WBS WORK PACKAGE TO ACTIVITY SYNC TRIGGERS
-- =========================================================================
create or replace function public.sync_wbs_element_to_activities()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  v_type public.activity_type;
begin
  v_type := 'Task'::public.activity_type;

  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    if new.is_work_package = true then
      -- If it's a work package, create or update activity
      insert into public.activities (project_id, wbs_element_id, name, type)
      values (new.project_id, new.id, new.name, v_type)
      on conflict (wbs_element_id) do update
      set name = excluded.name;
    else
      -- If is_work_package changed from true to false, remove activity
      delete from public.activities where wbs_element_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trigger_sync_wbs_to_activities
after insert or update of is_work_package, name
on public.wbs_elements
for each row
execute function public.sync_wbs_element_to_activities();
