Product Requirements Document (PRD)
Sprint 32: Back Office — Internal Roles & Account Management

1. Objective & Scope
The objective of Sprint 32 is to build internal role differentiation beyond Superadmin — Support/Ops Admin and Account Manager roles — plus lightweight account-management tooling for a named internal person to own a specific set of (typically enterprise/dedicated) customer relationships.
By the end of this sprint:
Support/Ops Admin can help customers with limited, non-destructive back-office access
Account Managers see only their assigned accounts, with health tracking and notes
Enterprise customers have a named internal point of contact, not just a ticket queue
Significant events on an assigned account (payment failure, downgrade) notify the responsible Account Manager
Out of scope for this sprint: a full internal CRM replacement — this is lightweight, internal-use account health tracking, not a Salesforce-equivalent system.
Hard dependency: This sprint requires Sprint 31's back office to exist, since it's adding role-based scoping on top of that console rather than building a new one. It also uses Sprint 17's notification infrastructure for Account Manager alerts.

2. User Stories
As a Superadmin, I want to grant limited back-office access to support staff, so that they can help customers without having full platform-wide override capability.
As an Account Manager, I want to see only the accounts assigned to me, so that I have a focused view of my book of business rather than the entire platform.
As an Enterprise customer, I want a named point of contact at the platform company, so that I have a relationship, not just a support ticket queue.

3. Functional Requirements
3.1 Internal Role Hierarchy
Superadmin: full back-office access, as built in Sprint 31 — no change to this role's capability in this sprint.
Support/Ops Admin: can view tenant detail and use limited troubleshooting tools (read-only impersonation), but cannot issue manual tier overrides or billing changes.
Account Manager: scoped to a specific assigned set of organizations, with visibility into usage/health/billing status for those accounts plus notes/tracking, but no platform-wide visibility.
3.2 Account Assignment
A Superadmin can assign one or more Account Managers to a specific organization.
An organization can have a designated primary Account Manager, with additional non-primary Account Managers supported (e.g., a technical account manager alongside a primary relationship owner).
3.3 Account Health & Notes
Account Managers can log notes and set a health status (healthy/at-risk/churning) for their assigned accounts.
Key usage signals for assigned accounts are visible to the Account Manager, surfaced from existing platform usage data rather than a separately tracked copy.
This is internal-use, lightweight tracking — not a replacement for a dedicated CRM system.
3.4 Internal Notification Integration
Significant events on an assigned account — payment failure, tier downgrade, support escalation — notify the account's designated Account Manager(s), reusing Sprint 17's notification dispatch architecture.

4. Acceptance Criteria
A Support/Ops Admin can view tenant detail and use read-only impersonation but cannot execute a manual tier override or billing change, verified by an explicit permission-denied test.
An Account Manager assigned to a specific set of organizations sees only those organizations in their back-office view, not the full platform directory, verified by comparing views across two different Account Managers with different assignments.
Account health notes and status logged by an Account Manager are correctly retained and visible to other internal staff with appropriate access.
A payment failure or downgrade event on an assigned account correctly triggers a notification to that account's designated Account Manager(s).

5. Non-Functional & Security Requirements
Requirement
Detail
Least Privilege
Each role is strictly scoped to Section 3.1's description — a Support/Ops Admin must be structurally unable to perform a Superadmin-only action, enforced at the API layer, not merely hidden in the UI.
Data Isolation
An Account Manager's view is strictly filtered to their assigned organizations at the query layer.
Auditability
Account assignment changes and health-status updates are logged, consistent with this phase's overall auditability standard.


6. Implementation Task Breakdown: Sprint 32
[Phase 1: Internal Role Schema] ──> [Phase 2: Role-Scoped Back Office Views] ──> [Phase 3: Account Assignment & Health Tracking] ──> [Phase 4: Account Manager Notifications]

Phase 1: Internal Role Schema
Goal: Extend Sprint 31's internal staff model with real role differentiation.
[ ] Task 1.1: Design Internal Role Schema
Create public.internal_staff (id, role enum [superadmin/support_admin/account_manager]) and public.account_assignments (internal_staff_id, organization_id, is_primary).
Phase 2: Role-Scoped Back Office Views
Goal: Enforce the least-privilege boundaries at the API layer.
[ ] Task 2.1: Restrict Support/Ops Admin Actions


Limit this role to view + read-only impersonation, blocking override/billing endpoints entirely at the API layer.
[ ] Task 2.2: Filter Account Manager Views


Restrict all back-office queries for this role to organizations in their account_assignments.
Phase 3: Account Assignment & Health Tracking
Goal: Build the assignment management and lightweight CRM functionality.
[ ] Task 3.1: Build Assignment Management UI


Superadmin-facing interface to assign/reassign Account Managers to organizations, including primary designation.
[ ] Task 3.2: Build Account Health & Notes UI


Interface for Account Managers to log notes and set health status on their assigned accounts, surfacing existing usage signals rather than duplicating that data.
Phase 4: Account Manager Notifications
Goal: Close the loop so Account Managers hear about problems without having to check manually.
[ ] Task 4.1: Wire Event Notifications
Trigger notifications to assigned Account Manager(s) on payment failure, downgrade, and support escalation events, via Sprint 17's dispatch architecture.

7. Sprint Delivery Milestones
Milestone 1 — Internal Role Schema Live (Target: Day 2) internal_staff and account_assignments tables deployed, extending Sprint 31's model.
Milestone 2 — Role-Scoped Views Working (Target: Day 5) Support/Ops Admin and Account Manager roles correctly restricted at the API layer, verified against explicit permission-denied tests.
Milestone 3 — Assignment & Health Tracking Working (Target: Day 7) Account assignment and health/notes functionality work correctly, with Account Manager views correctly filtered.
Milestone 4 — Notifications & Sprint Sign-Off (Target: Day 8) Account Manager notifications fire correctly on relevant events; all Section 4 acceptance criteria pass — this milestone closes out the entire Back Office phase.

8. Open Questions Carried Into This Sprint
Multiple Account Managers per account: recommend supporting multiple with one flagged is_primary, since larger enterprise accounts often have more than one internal point of contact (e.g., a relationship owner plus a technical account manager).
Account health scoring: manual flag for this sprint, or usage-signal-derived scoring? Recommend manual for launch, with usage-based scoring as a clear future enhancement once enough usage-signal infrastructure exists across the platform.
Support/Ops Admin ticket integration: should this role's back-office access integrate with an external support ticketing system (Zendesk, Intercom, etc.), or stand alone? Not required for this sprint's launch scope, but worth flagging as a natural next step once real support volume exists.

End of Sprint 32 PRD. This sprint completes the entire Back Office phase (Subscription Engine → Payment Processing → Super Admin Console → Internal Roles & Account Management). With this, the platform has both a complete customer-facing product (Phases 1–9) and the commercial/operational layer needed to actually run it as a business.
Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.

