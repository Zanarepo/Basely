-- Project-level delete permissions
-- A workspace role never grants project deletion. Only the project creator or a
-- member explicitly granted can_delete on that project may delete it.

alter table public.project_members
  add column if not exists can_delete boolean not null default false;

create or replace function public.project_member_can_delete(p_project_id uuid, p_user_id uuid)
returns boolean
security definer
set search_path = public
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = p_project_id
      and user_id = p_user_id
      and can_delete = true
  );
$$;

drop policy if exists "Delete projects" on public.projects;

create policy "Delete projects"
  on public.projects for delete
  using (
    created_by = auth.uid()
    or public.project_member_can_delete(id, auth.uid())
  );
