-- Create product_lessons_learned table for Retrospective insights
create table if not exists public.product_lessons_learned (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  release_id uuid references public.releases(id) on delete cascade null,
  raw_notes text not null,
  synthesized_insights jsonb default '[]'::jsonb not null,
  status text check (status in ('pending_synthesis', 'synthesized', 'strategy_updated')) default 'pending_synthesis',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add strategic_risks and execution_moats to product_strategies to close the loop
alter table public.product_strategies
  add column if not exists strategic_risks jsonb default '[]'::jsonb,
  add column if not exists execution_moats jsonb default '[]'::jsonb;

-- Enable Row Level Security for product_lessons_learned
alter table public.product_lessons_learned enable row level security;

-- Policies for product_lessons_learned (using project_id -> organization_id relationship)
drop policy if exists "Allow members to read project lessons" on public.product_lessons_learned;
create policy "Allow members to read project lessons"
    on public.product_lessons_learned for select
    using (project_id in (
        select id from public.projects 
        where organization_id in (select organization_id from public.get_user_organizations(auth.uid()))
    ));

drop policy if exists "Allow members to insert project lessons" on public.product_lessons_learned;
create policy "Allow members to insert project lessons"
    on public.product_lessons_learned for insert
    with check (project_id in (
        select id from public.projects 
        where organization_id in (select organization_id from public.get_user_organizations(auth.uid()))
    ));

drop policy if exists "Allow members to update project lessons" on public.product_lessons_learned;
create policy "Allow members to update project lessons"
    on public.product_lessons_learned for update
    using (project_id in (
        select id from public.projects 
        where organization_id in (select organization_id from public.get_user_organizations(auth.uid()))
    ));

drop policy if exists "Allow members to delete project lessons" on public.product_lessons_learned;
create policy "Allow members to delete project lessons"
    on public.product_lessons_learned for delete
    using (project_id in (
        select id from public.projects 
        where organization_id in (select organization_id from public.get_user_organizations(auth.uid()))
    ));

