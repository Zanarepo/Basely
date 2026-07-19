-- Migration: Sprint 9 Stakeholders Schema

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_type_enum') then
    create type public.organization_type_enum as enum ('internal', 'external');
  end if;
end
$$;

create table if not exists public.stakeholders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  role_title text,
  organization_type public.organization_type_enum not null default 'internal',
  sub_category text,
  email text,
  phone text,
  influence integer check (influence >= 1 and influence <= 5),
  interest integer check (interest >= 1 and interest <= 5),
  communication_preference text,
  linked_user_id uuid references public.profiles(id) on delete set null,
  
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists stakeholders_project_id_idx on public.stakeholders(project_id);
create index if not exists stakeholders_linked_user_id_idx on public.stakeholders(linked_user_id);

-- RLS
alter table public.stakeholders enable row level security;

create policy "Select stakeholders" on public.stakeholders 
for select to authenticated 
using (public.can_user_read_project(project_id, auth.uid()));

create policy "Insert stakeholders" on public.stakeholders 
for insert to authenticated 
with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Update stakeholders" on public.stakeholders 
for update to authenticated 
using (public.can_user_write_project_wbs(project_id, auth.uid()))
with check (public.can_user_write_project_wbs(project_id, auth.uid()));

create policy "Delete stakeholders" on public.stakeholders 
for delete to authenticated 
using (public.can_user_write_project_wbs(project_id, auth.uid()));
