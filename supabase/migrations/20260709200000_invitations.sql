-- Migration: Invitation link-sharing system (Story 3.2)
-- Version: 20260709200000_invitations

create extension if not exists pgcrypto;

-- =========================================================================
-- 1. INVITATIONS TABLE
-- =========================================================================

create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

create table public.invitations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    token_hash text unique not null,
    role public.user_role not null default 'Team Member'::public.user_role,
    invitee_email text,
    expires_at timestamp with time zone not null,
    status public.invitation_status not null default 'pending'::public.invitation_status,
    created_by uuid references public.profiles(id) on delete set null,
    accepted_by uuid references public.profiles(id) on delete set null,
    accepted_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint invitations_role_not_admin check (role <> 'Admin'::public.user_role)
);

create index invitations_org_status_idx on public.invitations (organization_id, status);
create index invitations_token_hash_idx on public.invitations (token_hash);

-- =========================================================================
-- 2. ROW-LEVEL SECURITY
-- =========================================================================

alter table public.invitations enable row level security;

create policy "Allow Admins and PMs to read invitations in their organization"
    on public.invitations for select
    using (
        public.get_user_role_in_org(organization_id, auth.uid())
        in ('Admin'::public.user_role, 'PM'::public.user_role)
    );

-- Inserts and accepts go through security-definer RPCs only.

-- =========================================================================
-- 3. RPC: create_invitation_link
-- =========================================================================

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

-- =========================================================================
-- 4. RPC: accept_invitation
-- =========================================================================

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
