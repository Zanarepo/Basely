-- Migration: Organization bootstrap RPC
-- Version: 20260709100000_org_bootstrap

-- Optional team size metadata for onboarding
alter table public.organizations
    add column if not exists team_size integer check (team_size is null or team_size > 0);

-- Creates an organization and assigns the calling user as Admin (bypasses RLS chicken-and-egg)
create or replace function public.create_organization_with_admin(
    p_name text,
    p_team_size integer default null
)
returns uuid
security definer
set search_path = public
language plpgsql
as $$
declare
    v_user_id uuid;
    v_org_id uuid;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    if p_name is null or trim(p_name) = '' then
        raise exception 'Organization name is required';
    end if;

    if p_team_size is not null and p_team_size <= 0 then
        raise exception 'Team size must be a positive number';
    end if;

    insert into public.organizations (name, team_size)
    values (trim(p_name), p_team_size)
    returning id into v_org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (v_org_id, v_user_id, 'Admin'::public.user_role);

    return v_org_id;
end;
$$;

grant execute on function public.create_organization_with_admin(text, integer) to authenticated;
