Product Requirements Document (PRD)
Sprint 1: Foundation (Auth, Hierarchy, RBAC, & Project Setup)
1. Objective & Scope
The objective of Sprint 1 is to establish the secure, multi-tenant core architectural spine of the platform. By the end of this sprint, a user will be able to sign up, create or join an organization workspace, manage team roles, and provision a new project container with localized settings. This foundational layer enforces strict data isolation using PostgreSQL Row Level Security (RLS) before any core planning modules are introduced.
2. User Stories
As a new user, I want to sign up via email/password or OAuth so that I can securely access the platform.
As an Enterprise PMO Director, I want to create an organization workspace and invite team members with specific roles (Admin, PM, Team Member, Viewer) so that I can govern data access.
As a Project Manager, I want to initialize a project container by defining its name, client, currency, methodology, and calendar settings to prepare for detailed WBS planning.
3. Functional Requirements
3.1 Authentication & Onboarding
Support secure Email/Password authentication and standard OAuth providers via Supabase Auth.
Implement an onboarding post-login flow: If the user does not belong to an organization, force them to either Create an Organization or Accept a Pending Invitation.
3.2 Workspace & Organizational Hierarchy
Enforce a strict multi-tenant relational model: Organization $\rightarrow$ Workspace $\rightarrow$ Project.
A single user account can belong to multiple Organizations, but data visibility must remain strictly isolated within the active workspace session.
3.3 Role-Based Access Control (RBAC)
Implement a database-enforced permission grid utilizing standard system roles:
Admin: Full organization management, billing control, global user provisioning, and deletion.
PM (Project Manager): Full CRUD control over projects, schedules, budgets, and team assignments within their permitted workspaces.
Team Member: Can read project data, comment, update assigned tasks, and edit assigned documentation.
Viewer / Client: Read-only access to specific dashboards, schedules, or generated documents as permitted.
3.4 Project Initiation Wizard
Collect primary project metadata via a unified creation form:
Project Name & Optional Client Name.
Project Date Constraints (Target Start / Target Finish).
Primary Currency (e.g., USD, NGN, EUR) for downstream cost estimation alignment.
Project Methodology: Waterfall, Agile, or Hybrid.
Global Calendar Settings (Define default working days, e.g., Mon–Fri, and standard daily hours).
4. Non-Functional & Security Requirements
Data Isolation: Implement PostgreSQL Row Level Security (RLS) on all multi-tenant tables. Frontend API queries must natively filter data based on the authenticated user's session token JWT.
Performance: The baseline Next.js workspace routing layout must resolve authorization states and render dashboard frames in less than 500ms.
Implementation Task Breakdown: Sprint 1
This breakdown details the execution sequence required to wire the Next.js frontend directly to your Supabase backend.
[Phase 1: DB Schema & RLS] ──> [Phase 2: Next.js Auth] ──> [Phase 3: Workspace Flow] ──> [Phase 4: Project Setup UI]

Phase 1: Database Schema Architecture & Supabase RLS Setup
Goal: Construct the foundational tables, write core constraint rules, and lock down security at the database layer.
[ ] Task 1.1: Design Core Tables Script
Create a SQL migration script defining the structural relational tables:
public.profiles (Extended user profiles automatically synced with auth.users).
public.organizations (The top-level tenant container).
public.organization_members (The junction table mapping users to organizations, explicitly holding the user's role column enum: Admin, PM, Team Member, Viewer).
public.projects (The project master records linked to an organization, storing metadata: currency, methodology, start_date, calendar_config).
[ ] Task 1.2: Establish Automated Profile Sync Trigger
Write a PostgreSQL database function and a CREATE TRIGGER statement that automatically inserts a row into public.profiles whenever a new user confirms signup via Supabase Auth.
[ ] Task 1.3: Configure Row Level Security (RLS) Policies
Enable RLS on all four core tables. Write granular USING expressions inside Postgres to restrict data access:
Prevent users from selecting, inserting, updating, or deleting rows unless their active authenticated user ID exists within the corresponding organization_members tree.
[ ] Task 1.4: Define Custom PostgreSQL Database Functions (RPC)
Write an optimized PL/pgSQL function (get_user_permissions) that accepts a project_id or organization_id and outputs the current user's functional role, allowing Next.js middleware to run blazing-fast permission assertions.
Phase 2: Next.js Authentication & Middleware Integration
Goal: Authenticate users securely and establish client/server-side protection boundaries.
[ ] Task 2.1: Initialize Supabase Client Packages
Install @supabase/ssr inside the Next.js project. Configure cookie-based session handling utility functions for both React Client Components and Server Components.
[ ] Task 2.2: Build Core Auth Screens
Construct highly scannable, cleanly accessible login and registration interface components using Tailwind CSS. Support standard email validation, password requirements, and basic error feedback alerts.
[ ] Task 2.3: Configure Global Next.js Middleware Route Protection
Write a middleware.ts file targeting the /dashboard/* path. Intercept incoming routing requests to inspect the Supabase user session token. If the token is invalid or expired, execute a redirect pattern routing the user back to the /login route.
Phase 3: Workspace Management & Onboarding Flow
Goal: Guide users into valid workspace boundaries upon initial authentication.
[ ] Task 3.1: Build Workspace Interceptor Route
Establish a client routing gate. If an authenticated user logs in but does not have a linked organization record inside organization_members, intercept their journey and redirect them exclusively to an /onboarding selection interface.
[ ] Task 3.2: Build "Create Organization" Component UI
Construct a simple workspace onboarding form collecting organization legal/trading names and team size constraints. Wire this form to insert records into public.organizations and automatically set the creator's role explicitly to Admin within public.organization_members.
[ ] Task 3.3: Implement Workspace Switcher Component
Build a reusable drop-down layout component positioned inside the main application sidebar navigation. This allows cross-functional users to cleanly toggle between different workspace context views, updating the internal application context or URL structures natively.
Step 1: Link-Sharing Invitation System (High Priority)
Goal: Allow project managers to generate a secure, copyable link that automatically joins users to the organization upon signup/login.
[ ] Task 3.4: Create Link-Invite Database Logic
Write a Postgres function or setup a backend action that generates a secure, random string (cryptographic token) with an expiration date (e.g., 7 days) and inserts it into public.invitations with invitee_email left as NULL.
[ ] Task 3.5: Build "Invite Team" Dialog UI
Create a modal inside the Next.js Workspace settings panel. Include a dropdown to select the target role (PM, Team Member, Viewer) and a "Generate Invite Link" button.
When clicked, display a text field with the absolute URL containing the token: https://yourdomain.com/invite?token=xyz123.
[ ] Task 3.6: Build the Invite Landing Page Overwrite (/invite?token=...)
Create a dynamic public route in Next.js (app/invite/page.tsx).
Server-side check: Validate if the token exists, is pending, and has not crossed expires_at.
If valid, check if the user is currently logged in.
If logged in: Automatically execute a Supabase RPC function that inserts them into organization_members with the token's designated role, updates the token status if it’s single-use, and redirects them to the /dashboard.
If not logged in: Save the token to local storage or a session cookie, and redirect them to /register or /login. Upon successful auth completion, process the organization join step immediately.
📧 Step 2: Email Invitation Workflow (Fast Follow-up)
Goal: Allow formal email-targeted invites that seamlessly integrate with your existing token validation engine.
[ ] Task 3.7: Set up Email Infrastructure (Resend / SendGrid)
Provisions API keys inside your .env workspace variables for your chosen transactional email service.
Create a standardized HTML/Text email template: "You have been invited by [Name] to join [Organization Name] on the Project Management Platform."
[ ] Task 3.8: Create the Targeted Email Invite Form
In the same "Invite Team" modal, add an option to "Invite via Email". Collect the exact recipient email address and their targeted role.
[ ] Task 3.9: Deploy a Supabase Edge Function (send-email-invite)
Create an isolated, secure Supabase Edge Function written in TypeScript.
When the Next.js frontend calls this function, it:
Inserts a row into public.invitations, setting the invitee_email field explicitly.
Uses fetch to pass the payload to your email provider's API (e.g., Resend), embedding the unique token URL directly into the email body button.
[ ] Task 3.10: Tighten Security Checks for Email Invites
Update your /invite landing page logic: If the database invitation row has an invitee_email explicitly set, verify that the logged-in user’s authenticated email matches it exactly. This prevents unauthorized users from intercepting and clicking forwarded links meant for specific team members.

Phase 4: Project Initiation Wizard Implementation
Goal: Provide the functional entry interface for spinning up new project tracking instances.
[ ] Task 4.1: Build Multistep Project Setup Form UI
Develop a unified, visually guided input modal or stepper component for project provisioning:
Step 1: Core identification (Project Name, Client Reference, Description fields).
Step 2: Methodology execution choice (Waterfall / Agile / Hybrid radio selections).
Step 3: Financial alignment (Dropdown selecting standard multi-currency symbols).
Step 4: Schedule Baseline Inputs (Date pickers mapping Target Start and Target End constraints).
[ ] Task 4.2: Frontend Validation and Submission Integration
Apply robust schema validation rules using a library like Zod or native validation layers. Ensure date inputs are logical (e.g., Target End cannot precede Target Start). Wire the form up to commit a clean insertion call into the Supabase public.projects table using the active organization id.
[ ] Task 4.3: Build Project Dashboard Entry View
Design an active landing screen grid displaying initialized project cards belonging exclusively to the current active workspace. Apply RBAC conditional rendering rules: conceal the "New Project" creation button instantly from users whose organizational role evaluates as Team Member or Viewer.

