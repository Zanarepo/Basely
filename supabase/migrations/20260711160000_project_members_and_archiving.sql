-- Migration: Project Members, Archiving Columns, Creator Overrides, and RLS Policies
-- Version: 20260711160000_project_members_and_archiving

-- 1. Alter public.projects table to add columns
alter table public.projects
  add column if not exists is_archived boolean not null default false,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 2. Backfill created_by with organization owner for existing records
update public.projects p
set created_by = (
  select owner_id from public.organizations o
  where o.id = p.organization_id
)
where p.created_by is null;

-- 3. Create project_members junction table
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_project_member unique (project_id, user_id)
);

-- 4. Enable RLS on project_members
alter table public.project_members enable row level security;

-- 5. Drop existing projects policies
drop policy if exists "Allow members to read projects in organization" on public.projects;
drop policy if exists "Allow Admins and PMs to insert projects" on public.projects;
drop policy if exists "Allow Admins and PMs to update projects" on public.projects;
drop policy if exists "Allow Admins and PMs to delete projects" on public.projects;

-- 6. Create new projects policies with membership and archiving checks
create policy "Select projects"
  on public.projects for select
  using (
    -- Workspace Owner
    public.is_workspace_owner(organization_id, auth.uid())
    -- Admin role
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    -- Creator (always sees own project, even if archived)
    or (created_by = auth.uid())
    -- Active project + PM role
    or (not is_archived and public.get_user_role_in_org(organization_id, auth.uid()) = 'PM'::public.user_role)
    -- Active project + Project Member
    or (
      not is_archived 
      and exists (
        select 1 from public.project_members
        where project_id = id and user_id = auth.uid()
      )
    )
  );

create policy "Insert projects"
  on public.projects for insert
  with check (
    public.is_workspace_owner(organization_id, auth.uid())
    or public.get_user_role_in_org(organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role)
  );

create policy "Update projects"
  on public.projects for update
  using (
    public.is_workspace_owner(organization_id, auth.uid())
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    -- Creator override: creator can edit
    or (created_by = auth.uid())
    -- Active project + PM role
    or (not is_archived and public.get_user_role_in_org(organization_id, auth.uid()) = 'PM'::public.user_role)
    -- Active project + Project Member
    or (
      not is_archived 
      and exists (
        select 1 from public.project_members
        where project_id = id and user_id = auth.uid()
      )
    )
  );

create policy "Delete projects"
  on public.projects for delete
  using (
    public.is_workspace_owner(organization_id, auth.uid())
    or (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role)
    -- Creator override: creator can delete
    or (created_by = auth.uid())
  );

-- 7. Define project_members RLS policies
create policy "Select project members"
  on public.project_members for select
  using (
    exists (
      select 1 from public.projects
      where id = project_id
    )
  );

create policy "Manage project members"
  on public.project_members for all
  using (
    public.is_workspace_owner(
      (select organization_id from public.projects where id = project_id), 
      auth.uid()
    )
    or public.get_user_role_in_org(
      (select organization_id from public.projects where id = project_id),
      auth.uid()
    ) in ('Admin'::public.user_role, 'PM'::public.user_role)
    or exists (
      select 1 from public.projects
      where id = project_id and created_by = auth.uid()
    )
  );
