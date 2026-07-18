-- Migration: Add contingency type to projects
alter table public.projects 
add column if not exists contingency_type text not null default 'flat'
check (contingency_type in ('flat', 'percentage'));
