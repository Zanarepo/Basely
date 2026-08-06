create type public.announcement_type as enum ('info', 'warning', 'critical');

create table public.system_announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  type public.announcement_type not null default 'info'::public.announcement_type,
  link_url text,
  is_active boolean not null default false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

-- RLS
alter table public.system_announcements enable row level security;

-- Everyone can read active announcements
create policy "Anyone can read active system announcements"
  on public.system_announcements for select
  using (
    is_active = true 
    and (expires_at is null or expires_at > now())
  );

-- Only admins/service role can manage (we'll just use service role for backoffice so no complex policy needed for insert/update/delete right now)
