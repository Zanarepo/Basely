-- Add AI toggle to organizations

alter table public.organizations 
add column ai_features_enabled boolean not null default false;
