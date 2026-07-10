-- Migration: Advanced RBAC, Access Revocation, and Two-Level Admin Privileges
-- Version: 20260710120000_advanced_rbac_revocation

-- 1. SCHEMA UPDATES
alter table public.organization_members
  add column if not exists is_active boolean not null default true,
  add column if not exists added_by uuid references public.profiles(id) on delete set null,
  add column if not exists can_manage_all_members boolean not null default false;

-- 2. EXISTING DATA FIXUP
update public.organization_members m
set added_by = (
  select owner_id from public.organizations o
  where o.id = m.organization_id
)
where m.added_by is null;

-- 3. SECURITY HELPERS MODIFICATION (Filters by is_active = true)
create or replace function public.get_user_organizations(user_uuid uuid)
returns table (organization_id uuid)
security definer
set search_path = public
language sql
stable
as $$
    select organization_id from public.organization_members where user_id = user_uuid and is_active = true;
$$;

create or replace function public.get_user_role_in_org(org_uuid uuid, user_uuid uuid)
returns public.user_role
security definer
set search_path = public
language sql
stable
as $$
    select role from public.organization_members where organization_id = org_uuid and user_id = user_uuid and is_active = true;
$$;

-- 4. MEMBER CREATION INTERCEPTORS
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
  insert into public.organization_members (organization_id, user_id, role, added_by)
  values (v_org_id, v_user_id, 'Admin'::public.user_role, v_user_id);
  return v_org_id;
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
    v_user_id uuid;
    v_user_email text;
    v_hash text;
    v_invitation record;
    v_existing_role public.user_role;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    if p_token is null or trim(p_token) = '' then
        raise exception 'Invitation token is required';
    end if;

    v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

    select i.*, o.name as organization_name
    into v_invitation
    from public.invitations i
    join public.organizations o on o.id = i.organization_id
    where i.token_hash = v_hash
    limit 1;

    if v_invitation.id is null then
        raise exception 'Invalid invitation link';
    end if;

    if v_invitation.status <> 'pending'::public.invitation_status then
        raise exception 'This invitation has already been used or revoked';
    end if;

    if v_invitation.expires_at < timezone('utc'::text, now()) then
        update public.invitations
        set status = 'revoked'::public.invitation_status
        where id = v_invitation.id;
        raise exception 'This invitation has expired';
    end if;

    select email into v_user_email from public.profiles where id = v_user_id;

    if v_invitation.invitee_email is not null
        and lower(trim(v_invitation.invitee_email)) <> lower(trim(v_user_email)) then
        raise exception 'This invitation was sent to a different email address';
    end if;

    select role into v_existing_role
    from public.organization_members
    where organization_id = v_invitation.organization_id
      and user_id = v_user_id;

    if v_existing_role is null then
        insert into public.organization_members (organization_id, user_id, role, added_by)
        values (v_invitation.organization_id, v_user_id, v_invitation.role, v_invitation.created_by);
    else
        -- If already a member but inactive, reactivate them and update their role/inviter
        update public.organization_members
        set role = v_invitation.role,
            is_active = true,
            added_by = v_invitation.created_by
        where organization_id = v_invitation.organization_id and user_id = v_user_id;
    end if;

    update public.invitations
    set
        status = 'accepted'::public.invitation_status,
        accepted_by = v_user_id,
        accepted_at = timezone('utc'::text, now())
    where id = v_invitation.id;

    return v_invitation.organization_id;
end;
$$;

-- 5. NEW ADMINISTRATION RPC FUNCTIONS

-- Revoke / Reactivate access
create or replace function public.set_member_active_status(
  p_organization_id uuid, p_member_user_id uuid, p_is_active boolean
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_caller_id uuid;
  v_owner_id uuid;
  v_caller_role public.user_role;
  v_target_added_by uuid;
  v_caller_can_manage boolean;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then raise exception 'Not authenticated'; end if;

  select owner_id into v_owner_id from public.organizations where id = p_organization_id;
  if v_owner_id is null then raise exception 'Workspace not found'; end if;

  if p_member_user_id = v_owner_id then
    raise exception 'Cannot change active status of the workspace owner';
  end if;

  v_caller_role := public.get_user_role_in_org(p_organization_id, v_caller_id);
  if v_caller_role <> 'Admin'::public.user_role then
    raise exception 'Only workspace Admins can change member active status';
  end if;

  select added_by into v_target_added_by from public.organization_members
  where organization_id = p_organization_id and user_id = p_member_user_id;

  if v_caller_id <> v_owner_id then
    -- Admin is attempting to change status. Check if target was invited by the Owner.
    if v_target_added_by = v_owner_id then
      select can_manage_all_members into v_caller_can_manage from public.organization_members
      where organization_id = p_organization_id and user_id = v_caller_id;
      if coalesce(v_caller_can_manage, false) = false then
        raise exception 'Only the Owner or privileged Admins can revoke/reactivate members invited by the owner';
      end if;
    end if;
  end if;

  update public.organization_members
  set is_active = p_is_active
  where organization_id = p_organization_id and user_id = p_member_user_id;
end;
$$;

grant execute on function public.set_member_active_status(uuid, uuid, boolean) to authenticated;

-- Delete / Remove member
create or replace function public.remove_workspace_member(
  p_organization_id uuid, p_member_user_id uuid
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_caller_id uuid;
  v_owner_id uuid;
  v_caller_role public.user_role;
  v_target_added_by uuid;
  v_caller_can_manage boolean;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then raise exception 'Not authenticated'; end if;

  select owner_id into v_owner_id from public.organizations where id = p_organization_id;
  if v_owner_id is null then raise exception 'Workspace not found'; end if;

  if p_member_user_id = v_owner_id then
    raise exception 'Cannot remove the workspace owner';
  end if;

  v_caller_role := public.get_user_role_in_org(p_organization_id, v_caller_id);
  if v_caller_role <> 'Admin'::public.user_role then
    raise exception 'Only workspace Admins can remove members';
  end if;

  select added_by into v_target_added_by from public.organization_members
  where organization_id = p_organization_id and user_id = p_member_user_id;

  if v_caller_id <> v_owner_id then
    -- Admin is attempting to remove a member.
    select can_manage_all_members into v_caller_can_manage from public.organization_members
    where organization_id = p_organization_id and user_id = v_caller_id;

    if coalesce(v_caller_can_manage, false) = false then
      -- Non-privileged Admins can only delete members they themselves added/invited.
      if v_target_added_by is null or v_target_added_by <> v_caller_id then
        if v_target_added_by = v_owner_id then
          raise exception 'Only the Owner or privileged Admins can delete members invited by the owner';
        else
          raise exception 'Admins can only delete members they invited, unless given privilege';
        end if;
      end if;
    end if;
  end if;

  delete from public.organization_members
  where organization_id = p_organization_id and user_id = p_member_user_id;
end;
$$;

grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;

-- Set Admin Privilege (Owner only)
create or replace function public.set_admin_privilege(
  p_organization_id uuid, p_member_user_id uuid, p_can_manage boolean
)
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
  v_caller_id uuid;
  v_owner_id uuid;
  v_target_role public.user_role;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then raise exception 'Not authenticated'; end if;

  select owner_id into v_owner_id from public.organizations where id = p_organization_id;
  if v_owner_id <> v_caller_id then
    raise exception 'Only the workspace Owner can manage Admin privileges';
  end if;

  select role into v_target_role from public.organization_members
  where organization_id = p_organization_id and user_id = p_member_user_id;

  if v_target_role is null then
    raise exception 'Target user is not a member of the workspace';
  end if;

  if v_target_role <> 'Admin'::public.user_role then
    raise exception 'Privileges can only be granted to Admins';
  end if;

  if p_member_user_id = v_owner_id then
    raise exception 'Cannot modify owner privilege';
  end if;

  update public.organization_members
  set can_manage_all_members = p_can_manage
  where organization_id = p_organization_id and user_id = p_member_user_id;
end;
$$;

grant execute on function public.set_admin_privilege(uuid, uuid, boolean) to authenticated;

-- 6. POLICY ADJUSTMENTS

-- Read own memberships (regardless of active status)
drop policy if exists "Allow users to read their own memberships" on public.organization_members;
create policy "Allow users to read their own memberships"
    on public.organization_members for select
    using (auth.uid() = user_id);

-- Read organization details (members, active or inactive, can read name)
drop policy if exists "Allow members to read organization details" on public.organizations;
create policy "Allow members to read organization details"
    on public.organizations for select
    using (id in (select organization_id from public.organization_members where user_id = auth.uid()));
