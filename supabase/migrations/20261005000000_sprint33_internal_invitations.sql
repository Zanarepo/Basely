-- Migration: Internal invitations system (Sprint 33)
-- Version: 20261005000000_sprint33_internal_invitations

create extension if not exists pgcrypto;

-- =========================================================================
-- 1. INTERNAL INVITATIONS TABLE
-- =========================================================================

-- Reusing public.invitation_status from workspace invites

create table public.internal_invitations (
    id uuid primary key default gen_random_uuid(),
    token_hash text unique not null,
    role public.internal_staff_role not null default 'support_junior'::public.internal_staff_role,
    invitee_email text not null,
    expires_at timestamp with time zone not null,
    status public.invitation_status not null default 'pending'::public.invitation_status,
    created_by uuid references public.profiles(id) on delete set null,
    accepted_by uuid references public.profiles(id) on delete set null,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index internal_invitations_status_idx on public.internal_invitations (status);
create index internal_invitations_token_hash_idx on public.internal_invitations (token_hash);

-- =========================================================================
-- 2. ROW-LEVEL SECURITY
-- =========================================================================

alter table public.internal_invitations enable row level security;

create policy "Allow Superadmins to read internal invitations"
    on public.internal_invitations for select
    using (
        exists (
            select 1 from public.internal_staff
            where auth_user_id = auth.uid()
            and role = 'superadmin'::public.internal_staff_role
        )
    );

-- Inserts and accepts go through security-definer RPCs only.

-- =========================================================================
-- 3. RPC: create_internal_invitation
-- =========================================================================

create or replace function public.create_internal_invitation(
    p_email text,
    p_role public.internal_staff_role default 'support_junior'::public.internal_staff_role
)
returns json
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
    v_user_id uuid;
    v_caller_role public.internal_staff_role;
    v_token text;
    v_hash text;
    v_expires_at timestamptz;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    select role into v_caller_role
    from public.internal_staff
    where auth_user_id = v_user_id;

    if v_caller_role is null or v_caller_role <> 'superadmin'::public.internal_staff_role then
        raise exception 'Only Superadmins can create internal invitation links';
    end if;

    v_token := encode(gen_random_bytes(32), 'hex');
    v_hash := encode(digest(v_token, 'sha256'), 'hex');
    v_expires_at := timezone('utc'::text, now()) + interval '7 days';

    insert into public.internal_invitations (
        token_hash,
        role,
        invitee_email,
        expires_at,
        created_by
    )
    values (
        v_hash,
        p_role,
        lower(trim(p_email)),
        v_expires_at,
        v_user_id
    );

    return json_build_object(
        'token', v_token,
        'expires_at', v_expires_at
    );
end;
$$;

grant execute on function public.create_internal_invitation(text, public.internal_staff_role) to authenticated;

-- =========================================================================
-- 4. RPC: accept_internal_invitation
-- =========================================================================

create or replace function public.accept_internal_invitation(p_token text)
returns boolean
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
    v_user_id uuid;
    v_user_email text;
    v_hash text;
    v_invitation record;
    v_existing_role public.internal_staff_role;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    if p_token is null or trim(p_token) = '' then
        raise exception 'Invitation token is required';
    end if;

    v_hash := encode(digest(trim(p_token), 'sha256'), 'hex');

    select *
    into v_invitation
    from public.internal_invitations
    where token_hash = v_hash
    limit 1;

    if v_invitation.id is null then
        raise exception 'Invalid invitation link';
    end if;

    if v_invitation.status <> 'pending'::public.invitation_status then
        raise exception 'This invitation has already been used or revoked';
    end if;

    if v_invitation.expires_at < timezone('utc'::text, now()) then
        update public.internal_invitations
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
    from public.internal_staff
    where auth_user_id = v_user_id;

    if v_existing_role is null then
        insert into public.internal_staff (auth_user_id, email, role)
        values (v_user_id, lower(trim(v_user_email)), v_invitation.role);
    end if;

    update public.internal_invitations
    set
        status = 'accepted'::public.invitation_status,
        accepted_by = v_user_id,
        accepted_at = timezone('utc'::text, now())
    where id = v_invitation.id;

    return true;
end;
$$;

grant execute on function public.accept_internal_invitation(text) to authenticated;
