-- Migration: Auto-link stakeholders to user profiles and update triggers
-- Version: 20260824040000_auto_link_stakeholders

-- 1. Update handle_new_user to auto-link stakeholders when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'avatar_url', '')
    );
    
    -- Auto-link any existing stakeholders with the same email
    update public.stakeholders
    set linked_user_id = new.id
    where lower(email) = lower(new.email)
      and linked_user_id is null;

    return new;
end;
$$;

-- 2. Update accept_invitation to ensure stakeholders are linked if they somehow missed it
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

    -- Auto-link any stakeholders for this user since they accepted an invite
    update public.stakeholders
    set linked_user_id = v_user_id
    where lower(email) = lower(v_user_email)
      and linked_user_id is null;

    select role into v_existing_role
    from public.organization_members
    where organization_id = v_invitation.organization_id
      and user_id = v_user_id;

    if v_existing_role is null then
        insert into public.organization_members (organization_id, user_id, role, added_by)
        values (v_invitation.organization_id, v_user_id, v_invitation.role, v_invitation.created_by);
    else
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
grant execute on function public.accept_invitation(text) to authenticated;

-- 3. Backfill existing stakeholders that have matching profiles
update public.stakeholders s
set linked_user_id = p.id
from public.profiles p
where lower(s.email) = lower(p.email)
  and s.linked_user_id is null;
