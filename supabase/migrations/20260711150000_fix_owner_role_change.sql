-- Fix: Allow both the workspace Owner AND Admins to change roles.
-- Previously only users with role = 'Admin' were allowed. The owner is *typically*
-- an Admin, but this now explicitly checks owner_id to guarantee it.

create or replace function public.set_workspace_member_role(
  p_organization_id uuid, p_member_user_id uuid, p_role public.user_role
)
returns void security definer set search_path = public language plpgsql as $$
declare
  v_caller_id uuid;
  v_owner_id uuid;
  v_caller_role public.user_role;
  v_current_role public.user_role;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then raise exception 'Not authenticated'; end if;

  select owner_id into v_owner_id from public.organizations where id = p_organization_id;
  if v_owner_id is null then raise exception 'Workspace not found'; end if;

  -- Allow the Owner OR any Admin to change roles
  v_caller_role := public.get_user_role_in_org(p_organization_id, v_caller_id);
  if v_caller_id <> v_owner_id and v_caller_role <> 'Admin'::public.user_role then
    raise exception 'Only the workspace Owner or Admins can change roles';
  end if;

  select role into v_current_role from public.organization_members
  where organization_id = p_organization_id and user_id = p_member_user_id;
  if v_current_role is null then raise exception 'This user is not a member of the workspace'; end if;
  if p_member_user_id = v_owner_id then raise exception 'Transfer ownership to change the Owner'; end if;

  -- Non-owner Admins cannot promote to Admin or demote existing Admins
  if v_caller_id <> v_owner_id and
    (v_current_role = 'Admin'::public.user_role or p_role = 'Admin'::public.user_role) then
    raise exception 'Only the Owner can manage Admin roles';
  end if;

  update public.organization_members set role = p_role
  where organization_id = p_organization_id and user_id = p_member_user_id;
end;
$$;

revoke all on function public.set_workspace_member_role(uuid, uuid, public.user_role) from public;
grant execute on function public.set_workspace_member_role(uuid, uuid, public.user_role) to authenticated;
