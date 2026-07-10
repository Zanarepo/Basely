alter table public.organizations
  add column if not exists owner_id uuid references public.profiles(id) on delete restrict;

update public.organizations o
set owner_id = (
  select m.user_id from public.organization_members m
  where m.organization_id = o.id and m.role = 'Admin'::public.user_role
  order by m.created_at limit 1
)
where o.owner_id is null;

alter table public.organizations alter column owner_id set not null;

drop policy if exists "Allow authenticated users to create organizations" on public.organizations;

create or replace function public.protect_workspace_owner()
returns trigger security definer set search_path = public language plpgsql as $$
begin
  if new.owner_id is distinct from old.owner_id
     and current_setting('app.workspace_owner_transfer', true) <> 'true' then
    raise exception 'Workspace ownership can only be changed through a transfer';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_workspace_owner on public.organizations;
create trigger protect_workspace_owner before update on public.organizations
for each row execute function public.protect_workspace_owner();

create or replace function public.create_organization_with_admin(
  p_name text, p_team_size integer default null
)
returns uuid security definer set search_path = public language plpgsql as $$
declare v_user_id uuid; v_org_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_name is null or trim(p_name) = '' then raise exception 'Organization name is required'; end if;
  if p_team_size is not null and p_team_size <= 0 then raise exception 'Team size must be positive'; end if;

  insert into public.organizations (name, team_size, owner_id)
  values (trim(p_name), p_team_size, v_user_id) returning id into v_org_id;
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_user_id, 'Admin'::public.user_role);
  return v_org_id;
end;
$$;

create or replace function public.set_workspace_member_role(
  p_organization_id uuid, p_member_user_id uuid, p_role public.user_role
)
returns void security definer set search_path = public language plpgsql as $$
declare v_caller_id uuid; v_owner_id uuid; v_caller_role public.user_role; v_current_role public.user_role;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then raise exception 'Not authenticated'; end if;

  select owner_id into v_owner_id from public.organizations where id = p_organization_id;
  if v_owner_id is null then raise exception 'Workspace not found'; end if;
  v_caller_role := public.get_user_role_in_org(p_organization_id, v_caller_id);
  if v_caller_role <> 'Admin'::public.user_role then raise exception 'Only workspace Admins can change roles'; end if;

  select role into v_current_role from public.organization_members
  where organization_id = p_organization_id and user_id = p_member_user_id;
  if v_current_role is null then raise exception 'This user is not a member of the workspace'; end if;
  if p_member_user_id = v_owner_id then raise exception 'Transfer ownership to change the Owner'; end if;

  if v_caller_id <> v_owner_id and
    (v_current_role = 'Admin'::public.user_role or p_role = 'Admin'::public.user_role) then
    raise exception 'Only the Owner can manage Admin roles';
  end if;

  update public.organization_members set role = p_role
  where organization_id = p_organization_id and user_id = p_member_user_id;
end;
$$;

create or replace function public.transfer_workspace_ownership(
  p_organization_id uuid, p_new_owner_user_id uuid
)
returns void security definer set search_path = public language plpgsql as $$
declare v_caller_id uuid; v_owner_id uuid;
begin
  v_caller_id := auth.uid();
  select owner_id into v_owner_id from public.organizations where id = p_organization_id;
  if v_owner_id <> v_caller_id then raise exception 'Only the Owner can transfer workspace ownership'; end if;
  if p_new_owner_user_id = v_owner_id then raise exception 'Choose a different workspace member'; end if;
  if not exists (select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = p_new_owner_user_id) then
    raise exception 'The new Owner must already be a workspace member';
  end if;

  perform set_config('app.workspace_owner_transfer', 'true', true);
  update public.organizations set owner_id = p_new_owner_user_id where id = p_organization_id;
  update public.organization_members set role = 'Admin'::public.user_role
  where organization_id = p_organization_id and user_id in (v_owner_id, p_new_owner_user_id);
end;
$$;

revoke all on function public.set_workspace_member_role(uuid, uuid, public.user_role) from public;
grant execute on function public.set_workspace_member_role(uuid, uuid, public.user_role) to authenticated;
revoke all on function public.transfer_workspace_ownership(uuid, uuid) from public;
grant execute on function public.transfer_workspace_ownership(uuid, uuid) to authenticated;