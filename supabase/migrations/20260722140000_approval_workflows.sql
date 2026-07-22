-- Migration: Approval Workflows Schema (Sprint 22)

create table if not exists public.approval_policies (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null references public.organizations(id) on delete cascade,
    action_type text not null check (action_type in ('budget_baseline', 'schedule_baseline')),
    approver_definition text not null default 'Role:Admin',
    enabled boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uk_org_action_type unique (organization_id, action_type)
);

create table if not exists public.approval_requests (
    id uuid default gen_random_uuid() primary key,
    policy_id uuid not null references public.approval_policies(id) on delete cascade,
    requested_by_user_id uuid not null references auth.users(id) on delete cascade,
    status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
    decided_by_user_id uuid references auth.users(id) on delete set null,
    decision_comment text,
    payload jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    decided_at timestamptz
);

alter table public.approval_policies enable row level security;
alter table public.approval_requests enable row level security;

-- Policies for approval_policies
create policy "Admins can manage approval policies"
    on public.approval_policies for all
    using (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        or (select owner_id from public.organizations where id = organization_id) = auth.uid()
    )
    with check (
        public.get_user_role_in_org(organization_id, auth.uid()) = 'Admin'::public.user_role
        or (select owner_id from public.organizations where id = organization_id) = auth.uid()
    );

create policy "All organization members can view approval policies"
    on public.approval_policies for select
    using (
        public.get_user_role_in_org(organization_id, auth.uid()) is not null
        or (select owner_id from public.organizations where id = organization_id) = auth.uid()
    );

-- Policies for approval_requests
create policy "Users can view their own requests and admins can view all org requests"
    on public.approval_requests for select
    using (
        requested_by_user_id = auth.uid()
        or public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) = 'Admin'::public.user_role
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
    );

create policy "Users can insert their own requests if they are members"
    on public.approval_requests for insert
    with check (
        requested_by_user_id = auth.uid()
        and (
            public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) is not null
            or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
        )
    );

create policy "Admins can update requests to approve/reject"
    on public.approval_requests for update
    using (
        public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) = 'Admin'::public.user_role
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
    )
    with check (
        public.get_user_role_in_org((select organization_id from public.approval_policies where id = policy_id), auth.uid()) = 'Admin'::public.user_role
        or (select owner_id from public.organizations where id = (select organization_id from public.approval_policies where id = policy_id)) = auth.uid()
    );
