-- Migration: Targeted email invitations (Story 3.3)
-- Version: 20260709220000_email_invitations

create index if not exists invitations_invitee_email_idx
    on public.invitations (organization_id, lower(invitee_email))
    where invitee_email is not null;

create or replace function public.create_email_invitation(
    p_organization_id uuid,
    p_role public.user_role default 'Team Member'::public.user_role,
    p_invitee_email text default null
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
    v_email text;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    v_email := lower(trim(coalesce(p_invitee_email, '')));
    if v_email = '' then
        raise exception 'Invitee email is required';
    end if;

    if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
        raise exception 'Invitee email is invalid';
    end if;

    v_caller_role := public.get_user_role_in_org(p_organization_id, v_user_id);
    if v_caller_role is null or v_caller_role not in ('Admin'::public.user_role, 'PM'::public.user_role) then
        raise exception 'Only Admins and PMs can create invitation links';
    end if;

    if p_role = 'Admin'::public.user_role then
        raise exception 'Cannot invite users as Admin via email';
    end if;

    v_token := encode(gen_random_bytes(32), 'hex');
    v_hash := encode(digest(v_token, 'sha256'), 'hex');
    v_expires_at := timezone('utc'::text, now()) + interval '7 days';

    insert into public.invitations (
        organization_id,
        token_hash,
        role,
        invitee_email,
        expires_at,
        created_by
    )
    values (
        p_organization_id,
        v_hash,
        p_role,
        v_email,
        v_expires_at,
        v_user_id
    );

    return json_build_object(
        'token', v_token,
        'expires_at', v_expires_at,
        'invitee_email', v_email
    );
end;
$$;

grant execute on function public.create_email_invitation(uuid, public.user_role, text) to authenticated;