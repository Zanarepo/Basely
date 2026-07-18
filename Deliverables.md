# Sprint 1 Deliverables Status

This file tracks the status of deliverables for **Sprint 1: Foundation (Auth, Hierarchy, RBAC, & Project Setup)**. It is updated dynamically to reflect completed items, current progress, and upcoming tasks.

---

## 🚀 Completed Deliverables

### Epic 1: Multi-Tenant Architecture & Database Security
- [x] **SUB-1.1.1: Core Relational Database Schema Provisioning**
  - Database schema files implemented in `supabase/migrations/` ([20260709000000_init_schema.sql](file:///c:/Users/princ/3D%20Objects/ProjectManagement/supabase/migrations/20260709000000_init_schema.sql) and [20260710110000_workspace_ownership.sql](file:///c:/Users/princ/3D%20Objects/ProjectManagement/supabase/migrations/20260710110000_workspace_ownership.sql)).
  - Created tables: `public.profiles`, `public.organizations`, `public.organization_members`, and `public.projects`.
- [x] **SUB-1.1.2: Profile Sync Trigger**
  - Designed trigger (`on_auth_user_created`) and trigger handler function in Postgres to automatically create profile records when users register via Supabase Auth.
- [x] **SUB-1.2.1: Row-Level Security (RLS) Enablement**
  - Enabled RLS across all 4 core tables.
- [x] **SUB-1.2.2: Tenant Isolation Policies**
  - Formulated secure tenant isolation checking organization memberships inside `public.organization_members`.
- [x] **SUB-1.2.3: Helper Database Functions & RPCs**
  - Authored `get_user_permissions` and `get_user_role_in_org` database functions to perform access control checks at database and middleware boundaries.

### Epic 2: Authentication & Secure Routing Controls
- [x] **SUB-2.1.1: Supabase SSR Client Configurations**
  - Installed and configured `@supabase/ssr` to coordinate server, browser, and middleware client contexts.
- [x] **SUB-2.1.2: Authentication Interfaces**
  - Programmed login ([/login](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/login/page.tsx)) and sign-up ([/register](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/register/page.tsx)) user interfaces.
- [x] **SUB-2.1.3: Form Logic & Error Interception**
  - Configured auth form submit methods, validating credentials and surfacing server errors dynamically.
- [x] **SUB-2.2.1 & SUB-2.2.2: Next.js Session & Onboarding Route Middleware**
  - Implemented [src/middleware.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/middleware.ts) to block unauthenticated requests to `/dashboard/*` and intercept authenticated users without organizations to gate them to the onboarding sequence.

### Epic 3: Workspace Lifecycle & Team Onboarding Systems
- [x] **SUB-3.1.1: Workspace Creation**
  - Deployed an onboarding configuration form at [/onboarding](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/onboarding/page.tsx) creating top-tier organizations and elevating the founder to Admin role via database RPC `create_organization_with_admin`.
- [x] **SUB-3.1.2: Sidebar Workspace Switcher**
  - Added a collapsible sidebar switcher dropdown allowing users to jump contexts across multiple authorized workspaces.
- [x] **SUB-3.2.1: Invitations Database Schema**
  - Created table `public.invitations` keeping track of invite tokens, emails, role levels, and expirations ([20260709200000_invitations.sql](file:///c:/Users/princ/3D%20Objects/ProjectManagement/supabase/migrations/20260709200000_invitations.sql)).
- [x] **SUB-3.2.2: "Invite Team" Interface**
  - Implemented workspace setting modals providing selectable role settings and generating shareable/copyable invitation URLs ([InviteTeamModal.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/InviteTeamModal.tsx)).
- [x] **SUB-3.2.3: Invite Landing Route Handler**
  - Programmed server-side page/route handlers at [/invite/accept](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/invite/accept/route.ts) to process tokens, auto-add logged-in invitees into organizations via `accept_invitation` RPC, and route to dashboard.
- [x] **SUB-3.3.1: Transactional Email Infrastructure**
  - Configured Resend keys and localized environment variables (`RESEND_API_KEY`, `INVITE_EMAIL_FROM`) inside [.env.local](file:///c:/Users/princ/3D%20Objects/ProjectManagement/.env.local).
- [x] **SUB-3.3.2: Targeted Email Invitations Delivery**
  - Implemented directly via Next.js Server Actions calling the Resend API (deviated from Supabase Edge Functions to align with internal routing frameworks and reduce local deployment friction) inside [actions.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/lib/invitations/actions.ts).
- [x] **SUB-3.3.3: Invite Email Cross-Referencing**
  - Hardened [/invite/accept](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/invite/accept/route.ts) route to enforce that the logged-in email matches the invitee's target email.

### Epic 3 (Extended): Advanced RBAC — Access Revocation & Two-Level Admin Privileges
- [x] **Database Migration: [20260710120000_advanced_rbac_revocation.sql](file:///c:/Users/princ/3D%20Objects/ProjectManagement/supabase/migrations/20260710120000_advanced_rbac_revocation.sql)**
  - Added `is_active`, `added_by`, and `can_manage_all_members` columns to `public.organization_members`.
  - Updated `get_user_organizations` and `get_user_role_in_org` helper functions to filter by `is_active = true`, so revoked users are invisible to all RLS policies.
  - Updated `create_organization_with_admin` and `accept_invitation` RPCs to track `added_by` (who invited the member).
  - Added `set_member_active_status` RPC — enforces two-level authorization rules before revoking or reactivating a member.
  - Added `remove_workspace_member` RPC — enforces delete authorization checks (Owners can delete anyone; Admins can only delete members they invited, unless given privilege).
  - Added `set_admin_privilege` RPC — Owner-only toggle to grant/revoke `can_manage_all_members` privilege on Admins.
  - Updated RLS policies: inactive members can still read organization name (for the revoked workspace notice), but all other operations are blocked by `is_active = true` guards.
- [x] **Backend Server Actions ([member-actions.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/lib/workspace/member-actions.ts))**
  - Added `updateWorkspaceMemberActiveStatus`, `removeWorkspaceMember`, and `updateWorkspaceMemberAdminPrivilege` server actions.
- [x] **Middleware Update ([middleware.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/middleware.ts))**
  - Middleware now distinguishes between users with no memberships (→ `/onboarding`) and users with only revoked memberships (→ allowed through to `/dashboard` to see the "Access Revoked" screen).
- [x] **Dashboard Layout ([layout.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/dashboard/layout.tsx))**
  - Queries `is_active` and maps it to the `Workspace` context type. Only active workspaces are passed to the sidebar switcher.
- [x] **Dashboard Page ([page.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/app/dashboard/page.tsx))**
  - Renders a premium "Access Revoked" screen with an animated alert icon, workspace name, and a CTA link when the active workspace is inactive.
  - Passes `callerUserId` and `callerCanManageAllMembers` to `WorkspaceMembersPanel`.
- [x] **WorkspaceMembersPanel ([WorkspaceMembersPanel.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/WorkspaceMembersPanel.tsx))**
  - Active/Revoked status badge on every member row (green/red pill).
  - **Revoke / Reactivate** button (rose/emerald) — shown only when the caller has permission over that member.
  - **Remove (Delete)** button (trash icon) — permission-gated per two-level Admin rules.
  - **Privileged Admin checkbox** — editable by Owner only on Admin rows; grants the Admin `can_manage_all_members`.
  - All actions require build-time TypeScript enforcement + database-layer RLS/SECURITY DEFINER checks for defence in depth.

### Epic 4: Project Container Provisioning
- [x] **SUB-4.1.1: Multi-Step Project Wizard UI**
  - Built UI layout collecting project configurations: Project Name, Client Reference, Methodology choice (Waterfall, Agile, Hybrid), Currency selection, and Baseline Working Calendar dates ([ProjectWizardModal.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/ProjectWizardModal.tsx)).
- [x] **SUB-4.1.2: Form Validation**
  - Wired validation via Zod schemas to reject invalid entries (such as end dates before start dates) ([projects.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/lib/validations/projects.ts)).
- [x] **SUB-4.1.3: Supabase Creation Interfacing**
  - Connected the valid output directly to insertion statements targeting the `public.projects` table via Next.js Server Action ([actions.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/lib/projects/actions.ts)).
- [x] **SUB-4.2.1: Active Dashboard Projects Grid**
  - Coded visual dashboard card grids rendering active projects for the current workspace context ([ProjectsDashboard.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/ProjectsDashboard.tsx)).
- [x] **SUB-4.2.2: Role-Based Action Control (RBAC) Gating**
  - Integrated visual permission gates hiding administrative buttons (e.g. "New Project") from Viewer or Team Member roles ([ProjectsDashboard.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/ProjectsDashboard.tsx)).

### Sprint 2: Planning Core — WBS Data Model & Tree UI (Completed)
- [x] **WBS Schema & Constraints**:
  - Setup tables, constraints, self-referencing hierarchy keys, RLS security policies, and performance indexes ([20260717000000_wbs_elements.sql](file:///c:/Users/princ/3D%20Objects/ProjectManagement/supabase/migrations/20260717000000_wbs_elements.sql)).
- [x] **Auto-Numbering & Cycle Triggers**:
  - Implemented SQL triggers to recalculate WBS codes and block circular parenting dependencies at the database level ([20260717000000_wbs_elements.sql](file:///c:/Users/princ/3D%20Objects/ProjectManagement/supabase/migrations/20260717000000_wbs_elements.sql)).
- [x] **Interactive Tree CRUD & Dictionary Workspace**:
  - Developed the recursive tree component, sliding side details panel, validation rules, Next.js server actions, and a 20-step undo/redo stack ([WbsPlanningWorkspace.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/wbs/WbsPlanningWorkspace.tsx)).
- [x] **Native HTML5 Drag & Drop**:
  - Implemented client-side reordering, cross-branch drops with hover borders, and optimistic state code recalculators ([WbsTree.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/wbs/WbsTree.tsx)).

### Sprint 3: Scheduling & Critical Path Method (CPM) Engine (Completed)
- [x] **Schedule Data Model & RLS**:
  - Implemented schema migrations for `activities`, `dependencies`, `project_calendars`, and baseline tables ([20260718000000_schedule_cpm.sql](file:///c:/Users/princ/3D%20Objects/ProjectManagement/supabase/migrations/20260718000000_schedule_cpm.sql)).
  - Created PL/pgSQL sync triggers keeping WBS work packages and activities in a strict 1:1 sync.
- [x] **Topological CPM Core**:
  - Programmed calendar-aware forward/backward pass math, float calculations, and cycle detection DFS logic ([cpm.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/lib/schedule/cpm.ts)).
- [x] **Recalculation Server Actions**:
  - Implemented automatic rescheduling server actions, rollback safety hooks, and baseline variance calculations ([actions.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/lib/schedule/actions.ts)).
- [x] **Reference Testing**:
  - Deployed comprehensive type-safe unit/regression tests validating CPM mathematics against reference textbook networks ([cpm.test.ts](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/lib/schedule/cpm.test.ts)).

### Sprint 4: Planning Core — Gantt Chart UI (Completed)
- [x] **Gantt Split-Pane Workspace**:
  - Built unified project detail tabs routing between WBS Tree and Gantt view, with synchronized vertical scrolling ([GanttWorkspace.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/gantt/GanttWorkspace.tsx)).
- [x] **SVG Dependency Overlay & Drag Interactions**:
  - Designed interactive timeline canvas rendering summary rollup brackets, diamond milestones, rose critical path items, and dashed float tails.
  - Implemented drag-to-move rescheduling, drag-to-resize durations, and click-and-drag SVG dependency links with automatic live recalculations ([GanttTimelineCanvas.tsx](file:///c:/Users/princ/3D%20Objects/ProjectManagement/src/components/dashboard/gantt/GanttTimelineCanvas.tsx)).
- [x] **Zoom & Baseline Controls**:
  - Programmed zoom controls (Day, Week, Month, Quarter), horizontal panning, and baseline comparison views overlaying ghost bars and drift variance.
- [x] **Export Snapshot**:
  - Enabled visual snapshot print layouts for PDF and PNG exports.
- [x] **Tablet Touch Support**:
  - Mapped equivalent touch interactions (`onTouchStart`, etc.) for seamless tablet scheduling.

---

## ⏳ What's Left (In Progress & Pending)

### Epic 1: Database Seed Files
- [ ] **SUB-1.1.3: Mock Database Seeding**
  - Setup local development seeds with mock organization structures for testing.

---

## 🔮 Next Execution Steps

1. **Local Database Seeding (`SUB-1.1.3`)**: Generate sample workspaces and mock members to ease local development validation.
2. **Sprint 5 (Cost Core: Budgeting & EVM Data Model)**: Proceed to planning Phase 2 of Cost Core.
