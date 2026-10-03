-- Migration: Fix WBS Status and Prevent Infinite Cycles
-- Version: 20261021000000_fix_wbs_status_and_cycles


-- 2. Update check_wbs_cycle to track visited nodes and prevent infinite loops in the database trigger
create or replace function public.check_wbs_cycle(p_id uuid, p_parent_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_curr uuid;
  v_visited uuid[] := '{}';
begin
  v_curr := p_parent_id;
  while v_curr is not null loop
    if v_curr = p_id then
      return true;
    end if;
    if v_curr = any(v_visited) then
      return true; -- Prevent infinite loops if a cycle already exists higher up
    end if;
    v_visited := array_append(v_visited, v_curr);
    select parent_id into v_curr from public.wbs_elements where id = v_curr;
  end loop;
  return false;
end;
$$;
