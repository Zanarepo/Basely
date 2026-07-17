-- Migration: Work Breakdown Structure (WBS) persistence and hierarchy engine
-- Version: 20260717000000_wbs_elements

-- 1. Create custom status enum type
do $$
begin
  if not exists (select 1 from pg_type where typname = 'wbs_element_status') then
    create type public.wbs_element_status as enum ('Not Started', 'In Progress', 'Complete', 'On Hold');
  end if;
end
$$;

-- 2. Create the wbs_elements table
create table if not exists public.wbs_elements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  parent_id uuid references public.wbs_elements(id) on delete cascade,
  code text not null default '',
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  deliverables text,
  acceptance_criteria text,
  status public.wbs_element_status not null default 'Not Started'::public.wbs_element_status,
  is_work_package boolean not null default false,
  sort_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Composite indexes to keep queries and ordering fast
create index if not exists wbs_elements_project_parent_idx on public.wbs_elements(project_id, parent_id);
create index if not exists wbs_elements_project_sort_idx on public.wbs_elements(project_id, sort_order);

-- 4. Enable Row-Level Security
alter table public.wbs_elements enable row level security;

-- 5. Helper Security Definer functions for policies (prevents circular recursion)

-- Check if a user has read access to the project
create or replace function public.can_user_read_project(p_project_id uuid, p_user_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_org_id uuid;
  v_created_by uuid;
  v_is_archived boolean;
  v_role public.user_role;
begin
  select organization_id, created_by, is_archived 
  into v_org_id, v_created_by, v_is_archived 
  from public.projects where id = p_project_id;
  
  if v_org_id is null then
    return false;
  end if;
  
  -- Creator
  if v_created_by = p_user_id then
    return true;
  end if;
  
  -- Workspace Owner
  if public.is_workspace_owner(v_org_id, p_user_id) then
    return true;
  end if;
  
  -- Role in Org
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  if v_role = 'Admin'::public.user_role then
    return true;
  end if;
  
  -- If not archived, check PM or Project Member
  if not v_is_archived then
    if v_role = 'PM'::public.user_role then
      return true;
    end if;
    if public.is_project_member(p_project_id, p_user_id) then
      return true;
    end if;
  end if;
  
  return false;
end;
$$;

-- Check if a user has write/edit access to the project's WBS
create or replace function public.can_user_write_project_wbs(p_project_id uuid, p_user_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_org_id uuid;
  v_created_by uuid;
  v_is_archived boolean;
  v_role public.user_role;
begin
  select organization_id, created_by, is_archived 
  into v_org_id, v_created_by, v_is_archived 
  from public.projects where id = p_project_id;
  
  if v_org_id is null then
    return false;
  end if;
  
  -- Block changes on archived projects
  if v_is_archived then
    return false;
  end if;

  -- Creator
  if v_created_by = p_user_id then
    return true;
  end if;
  
  -- Workspace Owner
  if public.is_workspace_owner(v_org_id, p_user_id) then
    return true;
  end if;
  
  -- Role in Org (Admin and PM only; Team Member & Viewer are read-only)
  v_role := public.get_user_role_in_org(v_org_id, p_user_id);
  if v_role in ('Admin'::public.user_role, 'PM'::public.user_role) then
    return true;
  end if;
  
  return false;
end;
$$;

-- 6. Define RLS Policies for wbs_elements
create policy "Select WBS elements"
  on public.wbs_elements for select
  using (public.can_user_read_project(project_id, auth.uid()));

create policy "Insert WBS elements"
  on public.wbs_elements for insert
  with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update WBS elements"
  on public.wbs_elements for update
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Delete WBS elements"
  on public.wbs_elements for delete
  using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- 7. Database trigger: parent-child project matching validation
create or replace function public.check_wbs_element_project()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  if new.parent_id is not null then
    if (select project_id from public.wbs_elements where id = new.parent_id) <> new.project_id then
      raise exception 'Parent WBS element must belong to the same project';
    end if;
  end if;
  return new;
end;
$$;

create trigger trigger_wbs_project_check
  before insert or update on public.wbs_elements
  for each row
  execute function public.check_wbs_element_project();

-- 8. Database trigger: cycle prevention
create or replace function public.check_wbs_cycle(p_id uuid, p_parent_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_curr uuid;
begin
  v_curr := p_parent_id;
  while v_curr is not null loop
    if v_curr = p_id then
      return true;
    end if;
    select parent_id into v_curr from public.wbs_elements where id = v_curr;
  end loop;
  return false;
end;
$$;

create or replace function public.prevent_wbs_cycles()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  if new.parent_id is not null and public.check_wbs_cycle(new.id, new.parent_id) then
    raise exception 'Circular reference detected: a WBS element cannot be its own ancestor';
  end if;
  return new;
end;
$$;

create trigger trigger_wbs_cycle_check
  before update on public.wbs_elements
  for each row
  execute function public.prevent_wbs_cycles();

-- 9. WBS Auto-Numbering Engine functions
create or replace function public.recalculate_wbs_node_codes(
  p_project_id uuid,
  p_parent_id uuid,
  p_parent_code text
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  r record;
  v_idx integer := 1;
  v_computed_code text;
begin
  for r in 
    select id 
    from public.wbs_elements 
    where project_id = p_project_id 
      and (parent_id is not distinct from p_parent_id)
    order by sort_order, created_at
  loop
    if p_parent_code = '' then
      v_computed_code := v_idx::text;
    else
      v_computed_code := p_parent_code || '.' || v_idx::text;
    end if;
    
    update public.wbs_elements
    set code = v_computed_code
    where id = r.id and code <> v_computed_code;
    
    perform public.recalculate_wbs_node_codes(p_project_id, r.id, v_computed_code);
    
    v_idx := v_idx + 1;
  end loop;
end;
$$;

create or replace function public.trigger_recalculate_wbs_codes()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  v_project_id uuid;
begin
  if tg_op = 'DELETE' then
    v_project_id := old.project_id;
  else
    v_project_id := new.project_id;
  end if;

  if pg_trigger_depth() = 1 then
    perform public.recalculate_wbs_node_codes(v_project_id, null, '');
  end if;
  
  return null;
end;
$$;

create trigger trigger_wbs_recalculate
  after insert or delete or update of parent_id, sort_order, project_id
  on public.wbs_elements
  for each row
  execute function public.trigger_recalculate_wbs_codes();
