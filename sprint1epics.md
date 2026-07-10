Epic 1: Multi-Tenant Architecture & Database Security
Epic Summary: Design and deploy the foundational PostgreSQL relational tables, auto-profile syncing triggers, custom RPC tracking functions, and Row-Level Security (RLS) policies within Supabase to ensure robust data isolation across organizations.
🟢 Story 1.1: Core Relational Database Schema Provisioning
Jira Type: User Story
Story Description: As an engineer, I need the core workspace relational database tables provisioned so that down-stream authentication, role assignments, and project configurations have valid persistence contexts.
Dependencies: None
Sub-tasks:
[ ] SUB-1.1.1: Write and execute a SQL migration script creating public.profiles, public.organizations, public.organization_members (with Admin, PM, Team Member, Viewer role enums), and public.projects.
[ ] SUB-1.1.2: Write a PL/pgSQL function and database trigger linked to Supabase Auth auth.users to cleanly auto-provision a mirror record inside public.profiles upon user confirmation.
[ ] SUB-1.1.3: Setup local development seed scripts with mock organizational tiers for execution testing.
🟢 Story 1.2: Enforce Structural Tenant Isolation via PostgreSQL RLS
Jira Type: User Story
Story Description: As a security-focused engineer, I want all data tables guarded by PostgreSQL Row-Level Security (RLS) so that cross-tenant data leakage is fundamentally impossible at the data layer.
Dependencies: Blocks Story 1.1
Sub-tasks:
[ ] SUB-1.2.1: Enable RLS across public.profiles, public.organizations, public.organization_members, and public.projects.
[ ] SUB-1.2.2: Write the core tenant-isolation policy checking if the requesting user's auth.uid() matches an approved active assignment inside public.organization_members.
[ ] SUB-1.2.3: Write a high-performance database function (get_user_permissions) accessible via RPC for rapid server-side middleware permission mapping.
🔐 Epic 2: Authentication & Secure Routing Controls
Epic Summary: Implement user sign-up/login mechanisms using Next.js and Supabase Auth, combined with performance-optimized routing gateways to protect restricted dashboard views.
🟢 Story 2.1: Implement Session-Based Auth Screens & Layouts
Jira Type: User Story
Story Description: As a user, I want a modern, clean interface to sign up and authenticate into the platform safely.
Dependencies: Blocks Story 1.1
Sub-tasks:
[ ] SUB-2.1.1: Install and configure @supabase/ssr inside the Next.js framework directory structure.
[ ] SUB-2.1.2: Build out clean, accessible login and account registration pages utilizing Tailwind CSS.
[ ] SUB-2.1.3: Wire form submission fields into client-side tracking hooks handling error rendering states.
🟢 Story 2.2: Configure Next.js Middleware Session Gateways
Jira Type: User Story
Story Description: As a system administrator, I want unauthenticated routing requests to /dashboard/* intercepted and bounced back to security checkpoints so that application views are fully secured.
Dependencies: Blocks Story 2.1
Sub-tasks:
[ ] SUB-2.2.1: Code a global middleware.ts intercept tracking active user sessions via secure cookie headers.
[ ] SUB-2.2.2: Build a server-side lookup checking if an authenticated user is assigned a workspace; if missing, route cleanly to the /onboarding module.
🏢 Epic 3: Workspace Lifecycle & Team Onboarding Systems
Epic Summary: Build the functional pathways guiding newly registered users through tenant onboarding, workspace creation, and team composition via secure token or email sharing links.
🟢 Story 3.1: Workspace Instantiation Flow & Client Interceptors
Jira Type: User Story
Story Description: As a newly registered individual, I want to seamlessly spin up a brand new organization or switch contexts between multiple workspaces cleanly from my dashboard view.
Dependencies: Blocks Story 1.2, Story 2.2
Sub-tasks:
[ ] SUB-3.1.1: Develop the /onboarding creation screen setting organization names and automatically elevating the creator's workspace role explicitly to Admin.
[ ] SUB-3.1.2: Build the UI Workspace Switcher dropdown asset inside the universal left sidebar.

🟢 Story 3.2: Token Link-Sharing System (High Priority Delivery)
Jira Type: User Story
Story Description: As a Project Manager, I want to easily copy an invite link with access roles embedded so that team members join my workspace instantly without complex setup loops.
Dependencies: Blocks Story 1.1, Story 3.1
Sub-tasks:

[ ] SUB-3.2.1: Provision the public.invitations storage schema capturing tracking hashes, role targets, and expiration constants.

[ ] SUB-3.2.2: Construct the "Invite Team" workspace modal window displaying a selectable role mapping tool and dynamic copyable URLs (/invite?token=xyz).

[ ] SUB-3.2.3: Program the public route /invite server-side context handler to process token resolution, assign permissions, and navigate new workspace members to the dashboard.

🟢 Story 3.3: Targeted Email Invitation Engine (Fast Follow-Up)
Jira Type: User Story
Story Description: As a Project Manager, I want to invite team members formally by their exact email addresses so that access links remain fully secure and targeted.
Dependencies: Blocks Story 3.2
Sub-tasks:
[ ] SUB-3.3.1: Bind Resend/SendGrid transactional engine access keys inside regional configuration .env files.
[ ] SUB-3.3.2: Deploy a localized Supabase Edge Function (send-email-invite) handling programmatic database record entries and rendering the transactional HTML invite layout.
[ ] SUB-3.3.3: Inject cross-referencing logic on the entry route checking that the logged-in user’s authenticated email profile explicitly aligns with the internal database destination email target.
🛠️ Epic 4: Project Container Provisioning
Epic Summary: Build out the initial project wizard tracking metadata configuration limits, validation rules, and specialized access control displays inside the dashboard.
🟢 Story 4.1: Multi-Step Project Provisioning Wizard
Jira Type: User Story
Story Description: As a Project Manager, I want an onboarding form wizard to instantiate standard parameters (name, dates, currency, execution methods) before building structural work schedules.
Dependencies: Blocks Story 1.1, Story 3.1
Sub-tasks:
[ ] SUB-4.1.1: Construct the Multi-Step Project Wizard layout tracking Name mapping, Waterfall/Agile strategies, Currency types, and Baseline working calendar dates.
[ ] SUB-4.1.2: Implement frontend validation using Zod to enforce standard rules (e.g., stopping project generation if the target end date occurs before the start date).
[ ] SUB-4.1.3: Connect the validation output directly to a Supabase insert statement target.
🟢 Story 4.2: Workspace Dashboard & RBAC UI Visibility Control
Jira Type: User Story
Story Description: As an organization manager, I want the project landing dashboard to show cards for my active projects while using role visibility rules to hide administrative action components from unauthorized users.
Dependencies: Blocks Story 1.2, Story 4.1
Sub-tasks:
[ ] SUB-4.2.1: Code the main dashboard card layout fetching items dynamically based on the current workspace context.
[ ] SUB-4.2.2: Wrap administrative actionable components (like the "New Project" initialization button) inside code gates that check the user's role, hiding them from Team Member and Viewer profiles.
📊 End-to-End Dependency Graph & Execution Sequence
Your team should track execution flow sequencing linearly along this path to prevent architectural bottlenecks:
[Story 1.1: DB Schema Setup]
       │
       ├──> [Story 1.2: Postgres RLS Configuration] ──┐
       │                                              │
[Story 2.1: Next.js Auth Client UI]                   ├──> [Story 3.1: Workspace Flow] ──> [Story 3.2: Link Invites] ──> [Story 3.3: Email Engine]
       │                                              │               │
       └──> [Story 2.2: Next.js Middleware Rules] ────┘               └──> [Story 4.1: Project Wizard] ──> [Story 4.2: Dashboard Display]

🎯 Sprint 1 Delivery Milestones
Milestone 1: Database Integrity & Security Baseline (Target: Day 3)
Condition: Core tables deployed, user syncing triggers working cleanly, and testing shows that the Supabase data layer blocks cross-tenant reads via RLS.
Milestone 2: Middleware Routing & Session State Stability (Target: Day 6)
Condition: Next.js routing middleware correctly routes unauthenticated traffic out of the dashboard while funneling fresh sign-ups smoothly into workspace onboarding screens.
Milestone 3: Team Invitation Flow Loop Closure (Target: Day 9)
Condition: Workspace settings modal generates secure, copyable tokens that let external testers safely join an internal organization as functional members.
Milestone 4: Core Foundation Sign-Off (Target: Day 12)
Condition: Valid project managers can initialize project containers through the multistep wizard while team-member role gates hide restricted settings elements, passing all core acceptance tests.

