-- Migration: Initial Schema Setup for Project Management Platform
-- Version: 20260709000000_init_schema

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. ENUMS & CUSTOM TYPES
-- =========================================================================

-- User Roles for RBAC
create type public.user_role as enum ('Admin', 'PM', 'Team Member', 'Viewer');

-- Project Methodologies
create type public.project_methodology as enum ('Waterfall', 'Agile', 'Hybrid');

-- =========================================================================
-- 2. TABLES DEFINITIONS
-- =========================================================================

-- Profiles Table (Synced with auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organizations Table (Top-level Tenant)
create table public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Organization Members Junction Table (RBAC / Mapping)
create table public.organization_members (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role public.user_role not null default 'Team Member'::public.user_role,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_organization_user unique (organization_id, user_id)
);

-- Projects Table (Metadata Container)
create table public.projects (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    client_name text,
    description text,
    methodology public.project_methodology not null default 'Waterfall'::public.project_methodology,
    currency text not null default 'USD',
    start_date date,
    end_date date,
    calendar_config jsonb not null default '{"working_days": [1, 2, 3, 4, 5], "daily_hours": 8}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 3. SECURITY DEFINER HELPER FUNCTIONS (Bypasses RLS to avoid circular recursion)
-- =========================================================================

-- Retrieve organizations a user belongs to
create or replace function public.get_user_organizations(user_uuid uuid)
returns table (organization_id uuid)
security definer
set search_path = public
language sql
stable
as $$
    select organization_id from public.organization_members where user_id = user_uuid;
$$;

-- Retrieve role of user in organization
create or replace function public.get_user_role_in_org(org_uuid uuid, user_uuid uuid)
returns public.user_role
security definer
set search_path = public
language sql
stable
as $$
    select role from public.organization_members where organization_id = org_uuid and user_id = user_uuid;
$$;

-- =========================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;

-- --- profiles policies ---
create policy "Allow user to read own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Allow members of same organization to read profiles"
    on public.profiles for select
    using (
        exists (
            select 1 
            from public.get_user_organizations(auth.uid()) o1
            join public.get_user_organizations(profiles.id) o2 
            on o1.organization_id = o2.organization_id
        )
    );

create policy "Allow user to update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- --- organizations policies ---
create policy "Allow members to read organization details"
    on public.organizations for select
    using (id in (select organization_id from public.get_user_organizations(auth.uid())));

create policy "Allow authenticated users to create organizations"
    on public.organizations for insert
    with check (auth.uid() is not null);

create policy "Allow organization Admins to update organization details"
    on public.organizations for update
    using (public.get_user_role_in_org(id, auth.uid()) = 'Admin'::public.user_role);

create policy "Allow organization Admins to delete organization"
    on public.organizations for delete
    using (public.get_user_role_in_org(id, auth.uid()) = 'Admin'::public.user_role);

-- --- organization_members policies ---
create policy "Allow members to read members in same organization"
    on public.organization_members for select
    using (organization_id in (select organization_id from public.get_user_organizations(auth.uid())));

create policy "Allow organization Admins to insert members"
    on public.organization_members for insert
    with check (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role);

create policy "Allow organization Admins to update member roles"
    on public.organization_members for update
    using (public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role);

create policy "Allow organization Admins to delete members, or members to delete themselves"
    on public.organization_members for delete
    using (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        or user_id = auth.uid()
    );

-- --- projects policies ---
create policy "Allow members to read projects in organization"
    on public.projects for select
    using (organization_id in (select organization_id from public.get_user_organizations(auth.uid())));

create policy "Allow Admins and PMs to insert projects"
    on public.projects for insert
    with check (public.get_user_role_in_org(organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role));

create policy "Allow Admins and PMs to update projects"
    on public.projects for update
    using (public.get_user_role_in_org(organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role));

create policy "Allow Admins and PMs to delete projects"
    on public.projects for delete
    using (public.get_user_role_in_org(organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role));

-- =========================================================================
-- 5. TRIGGER FUNCTIONS FOR AUTH INTEGRATION
-- =========================================================================

-- Trigger to create a public profile automatically upon auth user signup
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
    return new;
end;
$$;

-- Create the trigger on auth.users
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- =========================================================================
-- 6. RPC RPC FUNCTIONS (get_user_permissions)
-- =========================================================================

-- RPC function to resolve role permission dynamically for middleware
create or replace function public.get_user_permissions(
    p_project_id uuid default null,
    p_organization_id uuid default null
)
returns public.user_role
security definer
set search_path = public
language plpgsql
stable
as $$
declare
    v_org_id uuid;
    v_role public.user_role;
    v_user_id uuid;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        return null;
    end if;

    if p_organization_id is not null then
        v_org_id := p_organization_id;
    elsif p_project_id is not null then
        select organization_id into v_org_id from public.projects where id = p_project_id;
    else
        raise exception 'Either project_id or organization_id must be provided';
    end if;

    select role into v_role from public.organization_members 
    where organization_id = v_org_id and user_id = v_user_id;

    return v_role;
end;
$$;
