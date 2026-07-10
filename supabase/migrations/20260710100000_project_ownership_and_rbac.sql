-- Migration: Project ownership and simplified workspace RBAC
-- Admins manage the whole workspace; other members manage only records they create.

alter table public.projects
    add column if not exists created_by uuid references public.profiles(id) on delete set null;

update public.projects as project
set created_by = (
    select member.user_id
    from public.organization_members as member
    where member.organization_id = project.organization_id
      and member.role = 'Admin'::public.user_role
    order by member.created_at
    limit 1
)
where project.created_by is null;

create or replace function public.set_project_creator()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
    if auth.uid() is null then
        raise exception 'Not authenticated';
    end if;

    if new.created_by is null then
        new.created_by := auth.uid();
    elsif new.created_by <> auth.uid() then
        raise exception 'Projects can only be created for the authenticated user';
    end if;

    return new;
end;
$$;

drop trigger if exists set_project_creator on public.projects;
create trigger set_project_creator
    before insert on public.projects
    for each row execute function public.set_project_creator();

drop policy if exists "Allow Admins and PMs to update projects" on public.projects;
create policy "Allow Admins or creators to update projects"
    on public.projects for update
    using (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        or created_by = auth.uid()
    )
    with check (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        or created_by = auth.uid()
    );

drop policy if exists "Allow Admins and PMs to delete projects" on public.projects;
create policy "Allow Admins or creators to delete projects"
    on public.projects for delete
    using (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        or created_by = auth.uid()
    );

-- Prevent direct client updates to membership roles. The RPC below is the only
-- supported role-changing path and preserves the final Admin in a workspace.
drop policy if exists "Allow organization Admins to update member roles" on public.organization_members;

create or replace function public.set_workspace_member_role(
    p_organization_id uuid,
    p_member_user_id uuid,
    p_role public.user_role
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
    v_caller_id uuid;
    v_current_role public.user_role;
    v_admin_count integer;
begin
    v_caller_id := auth.uid();
    if v_caller_id is null then
        raise exception 'Not authenticated';
    end if;

    if public.get_user_role_in_org(p_organization_id, v_caller_id) <> 'Admin'::public.user_role then
        raise exception 'Only workspace Admins can change roles';
    end if;

    select role into v_current_role
    from public.organization_members
    where organization_id = p_organization_id and user_id = p_member_user_id;

    if v_current_role is null then
        raise exception 'This user is not a member of the workspace';
    end if;

    if v_current_role = 'Admin'::public.user_role
        and p_role <> 'Admin'::public.user_role then
        select count(*) into v_admin_count
        from public.organization_members
        where organization_id = p_organization_id and role = 'Admin'::public.user_role;

        if v_admin_count <= 1 then
            raise exception 'A workspace must keep at least one Admin';
        end if;
    end if;

    update public.organization_members
    set role = p_role
    where organization_id = p_organization_id and user_id = p_member_user_id;
end;
$$;

grant execute on function public.set_workspace_member_role(uuid, uuid, public.user_role) to authenticated;