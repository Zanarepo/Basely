Tasks: Sprint 1 Progress



Epic 1: Database Schema & Supabase RLS [Completed]

[x] Create directory supabase/migrations under ProjectManagement/

[x] Write standard schema SQL migration script (20260709000000_init_schema.sql)

[x] Define custom enums (user_role, project_methodology)

[x] Create profiles, organizations, organization_members, and projects tables

[x] Establish triggers to automatically sync auth.users with public.profiles

[x] Write and enable Row-Level Security (RLS) policies for all tables

[x] Write RPC function get_user_permissions

[ ] Apply migration in Supabase SQL Editor (manual step in dashboard)



Epic 2: Authentication & Secure Routing [Completed]

[x] Initialize Next.js project inside ProjectManagement/

[x] Install required npm dependencies (@supabase/ssr, @supabase/supabase-js, zod, lucide-react)

[x] Create .env.local containing Supabase URL, publishable key, and secret key

[x] Setup Supabase client integrations (browser, server, middleware)

[x] Implement route protection and workspace-onboarding gating inside src/middleware.ts

[x] Fix auth callback — session cookies set on redirect response (email confirm + OAuth)

[x] Add Google and GitHub OAuth on login and register pages

[x] Create /dashboard and /onboarding landing pages with sign-out

[x] Build and verify project compiles successfully (npm run build)



Supabase Dashboard checklist (manual):

- Site URL: http://localhost:3000

- Redirect URLs: http://localhost:3000/auth/callback

- Enable Google provider (and GitHub if desired) under Authentication → Providers



Epic 3: Workspace Management & Onboarding [In Progress]

[x] Task 3.1: Workspace interceptor route (/onboarding gating via middleware)

[x] Task 3.2: Create Organization form on /onboarding (name + optional team size)

[x] Migration: create_organization_with_admin RPC (20260709100000_org_bootstrap.sql)

[ ] Apply org bootstrap migration in Supabase SQL Editor (manual step)

[x] Task 3.3: Workspace switcher + collapsible dashboard sidebar (ArrowRight toggle)

[x] Tasks 3.4–3.6: Link invite system (/invite page, invitations table, invite modal)

[x] Migration: invitations + RPCs (20260709200000_invitations.sql)

[ ] Apply invitations migration in Supabase SQL Editor (manual step)

[ ] Tasks 3.7–3.10: Email invitation workflow (fast follow-up)

