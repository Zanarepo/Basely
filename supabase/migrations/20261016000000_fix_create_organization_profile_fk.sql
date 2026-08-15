-- Fix FK constraint error when creating organization for newly signed-up users whose profile record is missing from public.profiles
create or replace function public.create_organization_with_admin(
  p_name text, p_team_size integer default null
)
returns uuid security definer set search_path = public, auth language plpgsql as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_email text;
  v_full_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if p_name is null or trim(p_name) = '' then raise exception 'Organization name is required'; end if;
  if p_team_size is not null and p_team_size <= 0 then raise exception 'Team size must be positive'; end if;

  -- 1. Ensure profile exists in public.profiles to satisfy foreign key constraint on organizations.owner_id
  select email, raw_user_meta_data->>'full_name' into v_email, v_full_name from auth.users where id = v_user_id;
  
  insert into public.profiles (id, email, full_name)
  values (v_user_id, coalesce(v_email, ''), coalesce(v_full_name, ''))
  on conflict (id) do update set
    email = excluded.email,
    full_name = case 
      when public.profiles.full_name is null or public.profiles.full_name = '' then excluded.full_name 
      else public.profiles.full_name 
    end;

  -- 2. Insert new organization
  insert into public.organizations (name, team_size, owner_id)
  values (trim(p_name), p_team_size, v_user_id) returning id into v_org_id;

  -- 3. Add owner as Admin in organization_members
  insert into public.organization_members (organization_id, user_id, role, added_by)
  values (v_org_id, v_user_id, 'Admin'::public.user_role, v_user_id)
  on conflict (organization_id, user_id) do nothing;

  return v_org_id;
end;
$$;

grant execute on function public.create_organization_with_admin(text, integer) to authenticated;
