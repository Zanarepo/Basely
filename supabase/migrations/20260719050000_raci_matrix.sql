-- Migration: Sprint 10 RACI Matrix Schema

do $$
begin
  if not exists (select 1 from pg_type where typname = 'raci_role_enum') then
    create type public.raci_role_enum as enum ('Responsible', 'Accountable', 'Consulted', 'Informed');
  end if;
end
$$;

create table if not exists public.raci_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  wbs_element_id uuid not null references public.wbs_elements(id) on delete cascade,
  stakeholder_id uuid not null references public.stakeholders(id) on delete cascade,
  role_type public.raci_role_enum not null,
  
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Indexes for performance
create index if not exists raci_assignments_project_id_idx on public.raci_assignments(project_id);
create index if not exists raci_assignments_wbs_element_id_idx on public.raci_assignments(wbs_element_id);
create index if not exists raci_assignments_stakeholder_id_idx on public.raci_assignments(stakeholder_id);

-- Enforce exactly one 'Accountable' role per wbs_element
create unique index if not exists single_accountable_idx 
on public.raci_assignments(wbs_element_id) 
where (role_type = 'Accountable');

-- Unique constraint: A stakeholder can't have the same role multiple times on the same element
create unique index if not exists unique_stakeholder_role_idx
on public.raci_assignments(wbs_element_id, stakeholder_id, role_type);

-- RLS
alter table public.raci_assignments enable row level security;

create policy "Select raci_assignments" on public.raci_assignments 
for select to authenticated 
using (public.can_user_read_project(project_id, auth.uid()));

create policy "Insert raci_assignments" on public.raci_assignments 
for insert to authenticated 
with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update raci_assignments" on public.raci_assignments 
for update to authenticated 
using (public.can_user_write_project_wbs(project_id, auth.uid()))
with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Delete raci_assignments" on public.raci_assignments 
for delete to authenticated 
using (public.can_user_write_project_wbs(project_id, auth.uid()));

-- Migration Step: Map existing wbs_elements.owner_id to RACI Accountable
-- 1. Create missing stakeholder records for users that are assigned to an owner_id but don't exist as stakeholders yet.
insert into public.stakeholders (project_id, name, organization_type, linked_user_id)
select distinct w.project_id, coalesce(p.full_name, p.email, 'Unknown User'), 'internal'::public.organization_type_enum, w.owner_id
from public.wbs_elements w
join public.profiles p on p.id = w.owner_id
where w.owner_id is not null 
and not exists (
  select 1 from public.stakeholders s 
  where s.linked_user_id = w.owner_id and s.project_id = w.project_id
);

-- 2. Create the Accountable assignment mapping owner_id -> Stakeholder.
insert into public.raci_assignments (project_id, wbs_element_id, stakeholder_id, role_type)
select w.project_id, w.id, s.id, 'Accountable'::public.raci_role_enum
from public.wbs_elements w
join public.stakeholders s on s.linked_user_id = w.owner_id and s.project_id = w.project_id
where w.owner_id is not null
on conflict (wbs_element_id) where (role_type = 'Accountable') do nothing;
