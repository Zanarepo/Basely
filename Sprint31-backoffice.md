Product Requirements Document (PRD)
Sprint 31: Back Office — Super Admin Console

1. Objective & Scope
The objective of Sprint (backoffice) 31 is to build the internal console giving platform staff visibility and control across every tenant — organizations, subscriptions, usage, and platform-wide health — entirely separate from any customer-facing surface.
By the end of this sprint, a Superadmin will be able to:
Search and browse every organization on the platform
Drill into any organization's full detail: users, subscription, billing history, usage
Manually override tier/subscription state for exceptions (goodwill credits, custom deals)
Impersonate a customer user, safely and with full logging, for support purposes
View platform-wide aggregate metrics
Out of scope for this sprint: internal role differentiation beyond Superadmin (Sprint 32 builds Support/Ops Admin and Account Manager scoping) — this sprint's access model is Superadmin-only, full-access.
Hard dependency: This sprint requires Sprint 29 (tier/subscription data) and Sprint 30 (real billing events) to have real data to display and act on. It should reuse Administration & Governance's Sprint 21 SSO infrastructure for internal authentication rather than building a separate login system.

2. User Stories
As a Superadmin, I want to see a list of every organization on the platform with their tier, seat count, and subscription status, so that I have a single view of the entire business.
As a Superadmin, I want to search for a specific organization and see its full detail, so that I can investigate a support issue or account question quickly.
As a Superadmin, I want to manually adjust an organization's tier or extend a trial, so that I can handle exceptions that don't fit the standard self-serve flow.
As a Superadmin, I want platform-wide usage/health metrics, so that I can see overall business health, not just one organization at a time.

3. Functional Requirements
3.1 Tenant Directory
A searchable, filterable list of every organization: name, tier, seat count, subscription status, signup date.
3.2 Tenant Detail View
Full user list, subscription/billing history, current usage against tier limits, and support-relevant metadata for a specific organization.
3.3 Manual Overrides
Tier change, seat allocation change, or subscription status change outside the normal self-serve/payment flow, each requiring a mandatory justification field.
Every override logged immutably.
3.4 Impersonation
Time-limited, explicitly-initiated sessions viewing the platform as a specific customer user, for support/troubleshooting.
Unmistakable on-screen indicator while an impersonation session is active.
Destructive actions (e.g., deleting the organization) blocked entirely during impersonation.
Full session logging: who impersonated whom, when, for how long.
3.5 Platform-Wide Metrics Dashboard
Aggregate metrics across all tenants: total organizations by tier, MRR/ARR, churn indicators, overall active usage.
Reuse the dashboard/widget architecture from Reporting Layer's Sprint 19/20 where the underlying pattern fits, rather than building a second dashboard framework.

4. Acceptance Criteria
A Superadmin can search for any organization by name and view its complete detail within the back office.
A manual tier override correctly updates the organization's access and is logged with who, when, and why (justification required, not optional).
Impersonation sessions are time-limited, require explicit initiation, and are fully logged with start/end time and acting Superadmin identity.
The platform-wide metrics dashboard correctly aggregates data across every organization, matching the sum of individual tenant records exactly.

5. Non-Functional & Security Requirements
Requirement
Detail
Security
Back office access restricted to internal staff accounts only, entirely separate from customer authentication; internal SSO recommended, reusing Sprint 21's infrastructure.
Impersonation Safety
Must never be silent — an unmistakable indicator is required whenever active; destructive actions must be structurally blocked, not just discouraged.
Auditability
Every override and impersonation session logged immutably, extending Administration & Governance's Sprint 23 governance audit log pattern rather than building a parallel system.
Data Isolation (Inverted)
This console's entire purpose is cross-tenant visibility for authorized staff — the security control is restricting who gets this view, not preventing the view itself.


6. Implementation Task Breakdown: Sprint 31
[Phase 1: Internal Auth & Access Control] ──> [Phase 2: Tenant Directory & Detail View] ──> [Phase 3: Manual Overrides] ──> [Phase 4: Impersonation] ──> [Phase 5: Platform Metrics Dashboard]

Phase 1: Internal Auth & Access Control
Goal: Establish a fully separate authentication path before any tenant data is exposed.
[ ] Task 1.1: Build Internal Staff Authentication


A separate login path for internal staff, distinct from customer organization_members, reusing Sprint 21's SSO infrastructure.
[ ] Task 1.2: Gate the Entire Console Behind Superadmin Role


At minimum a single Superadmin role for this sprint (Sprint 32 adds further differentiation).
Phase 2: Tenant Directory & Detail View
Goal: Build the core browsing and investigation experience.
[ ] Task 2.1: Build the Tenant Directory List


Searchable/filterable list of all organizations.
[ ] Task 2.2: Build the Tenant Detail View


Aggregate users, subscription, billing, and usage data for a single organization.
Phase 3: Manual Overrides
Goal: Let Superadmins handle exceptions safely and traceably.
[ ] Task 3.1: Build Override Actions


Tier change, seat adjustment, subscription status change, each requiring justification text.
[ ] Task 3.2: Wire Override Logging


Log every override into the governance audit log pattern (Sprint 23).
Phase 4: Impersonation
Goal: Build safe, fully-logged support impersonation.
[ ] Task 4.1: Build Impersonation Session Initiation


Time-limited session start with an unmistakable persistent UI indicator while active.
[ ] Task 4.2: Block Destructive Actions During Impersonation


Explicitly disable organization deletion and other irreversible actions while impersonating.
[ ] Task 4.3: Log Full Session Detail


Start/end time, acting Superadmin, and impersonated user, retained immutably.
Phase 5: Platform Metrics Dashboard
Goal: Give Superadmins a business-health view, not just individual tenant detail.
[ ] Task 5.1: Build Cross-Tenant Aggregate Metrics
MRR/ARR, tier distribution, churn signals, reusing Sprint 19/20's dashboard architecture where the pattern fits.

7. Sprint Delivery Milestones
Milestone 1 — Internal Auth Live (Target: Day 3) Separate internal staff authentication working, fully isolated from customer login paths.
Milestone 2 — Tenant Directory & Detail Working (Target: Day 6) Superadmins can search and drill into any organization's full detail.
Milestone 3 — Manual Overrides Working (Target: Day 8) Overrides correctly update organization state and are logged with mandatory justification.
Milestone 4 — Impersonation, Metrics & Sprint Sign-Off (Target: Day 12) Impersonation is safe, visible, and fully logged; platform metrics dashboard aggregates correctly; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Impersonation write access: full write access as the customer user, or read-only view only? Recommend read-only by default, with a separate, more heavily logged "write impersonation" mode reserved for senior support staff only — full write impersonation by default risks a support action being mistaken for the customer's own.
Trial extension governance: should overrides require a second approver, mirroring Administration & Governance's Sprint 22 approval pattern, or is single-Superadmin-action-with-justification sufficient? Recommend single-action for now, with a second-approver requirement as a future addition if misuse becomes a concern.
Metrics refresh cadence: should the platform metrics dashboard be fully live, or refreshed on a reasonable interval (e.g., hourly)? Given this is cross-tenant aggregation at potentially large scale, a scheduled refresh may be more practical than fully live computation — worth a performance-driven decision rather than defaulting to "always live" out of habit.

End of Sprint 31 PRD. Impersonation (Phase 4) is the single most sensitive feature in this sprint — treat its safety requirements (visible indicator, blocked destructive actions, full logging) as non-negotiable, not implementation details to simplify under time pressure.
Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.

