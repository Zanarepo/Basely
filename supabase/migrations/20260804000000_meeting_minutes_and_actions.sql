-- =========================================================================
-- SPRINT 40: MEETING MINUTES & ACTION ITEMS SCHEMA
-- =========================================================================

-- 1. MEETING MINUTES TABLE
create table public.meeting_minutes (
    id uuid default gen_random_uuid() primary key,
    project_id uuid not null references public.projects(id) on delete cascade,
    meeting_date timestamp with time zone not null,
    attendee_stakeholder_ids uuid[] default array[]::uuid[],
    discussion_notes text,
    decisions jsonb default '[]'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ACTION ITEMS TABLE
create table public.action_items (
    id uuid default gen_random_uuid() primary key,
    project_id uuid not null references public.projects(id) on delete cascade,
    description text not null,
    owner_stakeholder_id uuid references public.stakeholders(id) on delete set null,
    due_date timestamp with time zone,
    status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
    source_meeting_minutes_id uuid references public.meeting_minutes(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ENABLE ROW LEVEL SECURITY
alter table public.meeting_minutes enable row level security;
alter table public.action_items enable row level security;

-- 4. RLS POLICIES FOR MEETING MINUTES
create policy "Allow members to read meeting minutes in organization"
    on public.meeting_minutes for select
    using (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and p.organization_id in (select organization_id from public.get_user_organizations(auth.uid()))
        )
    );

create policy "Allow PMs and Team to insert meeting minutes"
    on public.meeting_minutes for insert
    with check (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and public.get_user_role_in_org(p.organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );

create policy "Allow PMs and Team to update meeting minutes"
    on public.meeting_minutes for update
    using (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and public.get_user_role_in_org(p.organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );

create policy "Allow PMs and Team to delete meeting minutes"
    on public.meeting_minutes for delete
    using (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and public.get_user_role_in_org(p.organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );


-- 5. RLS POLICIES FOR ACTION ITEMS
create policy "Allow members to read action items in organization"
    on public.action_items for select
    using (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and p.organization_id in (select organization_id from public.get_user_organizations(auth.uid()))
        )
    );

create policy "Allow PMs and Team to insert action items"
    on public.action_items for insert
    with check (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and public.get_user_role_in_org(p.organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );

create policy "Allow PMs and Team to update action items"
    on public.action_items for update
    using (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and public.get_user_role_in_org(p.organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );

create policy "Allow PMs and Team to delete action items"
    on public.action_items for delete
    using (
        exists (
            select 1 from public.projects p
            where p.id = project_id
            and public.get_user_role_in_org(p.organization_id, auth.uid()) in ('Admin'::public.user_role, 'PM'::public.user_role, 'Team Member'::public.user_role)
        )
    );
