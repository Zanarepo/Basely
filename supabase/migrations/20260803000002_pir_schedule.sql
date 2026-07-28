-- Add PIR scheduling fields to projects table

alter table public.projects
add column if not exists pir_scheduled_date timestamp with time zone,
add column if not exists pir_notified boolean not null default false;
