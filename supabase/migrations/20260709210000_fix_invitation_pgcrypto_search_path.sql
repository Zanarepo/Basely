-- Migration: Repair invitation RPC pgcrypto lookup
-- Version: 20260709210000_fix_invitation_pgcrypto_search_path

-- Supabase installs extension functions such as gen_random_bytes and digest in
-- the extensions schema. These SECURITY DEFINER functions must include that
-- schema explicitly because they pin their search_path.

create or replace function public.create_invitation_link(
    p_organization_id uuid,
    p_role public.user_role default 'Team Member'::public.user_role
)
returns json
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
    v_user_id uuid;
    v_caller_role public.user_role;
    v_token text;
    v_hash text;
    v_expires_at timestamptz;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    v_caller_role := public.get_user_role_in_org(p_organization_id, v_user_id);
    if v_caller_role is null or v_caller_role not in ('Admin'::public.user_role, 'PM'::public.user_role) then
        raise exception 'Only Admins and PMs can create invitation links';
    end if;

    if p_role = 'Admin'::public.user_role then
        raise exception 'Cannot invite users as Admin via link';
    end if;

    v_token := encode(gen_random_bytes(32), 'hex');
    v_hash := encode(digest(v_token, 'sha256'), 'hex');
    v_expires_at := timezone('utc'::text, now()) + interval '7 days';

    insert into public.invitations (
        organization_id,
        token_hash,
        role,
        expires_at,
        created_by
    )
    values (
        p_organization_id,
        v_hash,
        p_role,
        v_expires_at,
        v_user_id
    );

    return json_build_object(
        'token', v_token,
        'expires_at', v_expires_at
    );
end;
$$;

grant execute on function public.create_invitation_link(uuid, public.user_role) to authenticated;

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
        insert into public.organization_members (organization_id, user_id, role)
        values (v_invitation.organization_id, v_user_id, v_invitation.role);
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