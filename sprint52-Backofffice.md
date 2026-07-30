Product Requirements Document (PRD)
Sprint 29: Back Office — Subscription & Feature-Gating Engine

1. Objective & Scope
The objective of Sprint 29 is to build the tier definition data model and feature-gate enforcement mechanism — the foundation every other sprint in this phase depends on. Without this, payment processing (Sprint 30) has nothing real to sell, and the back office (Sprint 31) has no subscription data to manage.
By the end of this sprint:
Every feature across all 9 prior phases is mapped to exactly one tier in a central, data-driven table
Gated actions are blocked at the API layer, not just the UI
Usage limits (seats, active projects) are enforced distinctly from feature gates
A downgrade never deletes data — it locks it
Out of scope for this sprint: actual payment processing (Sprint 30), the super admin back office UI (Sprint 31), and internal staff roles (Sprint 32) — this sprint is the data model and enforcement layer only.
Hard dependency: This sprint requires Foundation's Sprint 1 organization model, and touches the API surface of every one of Phases 2–9, since each phase's capabilities become gateable features. This is the widest-reaching retrofit in the entire platform build sequence.

2. User Stories
As a platform operator, I want every feature across all 9 phases mapped to a tier, so that gating is centrally defined rather than scattered as ad hoc checks throughout the codebase.
As an organization admin, I want to see clearly what my current tier includes and what upgrading would unlock, so that I understand exactly what I'm paying for.
As a Free-tier user hitting a limit, I want a clear, specific upgrade prompt, so that I understand exactly why something is blocked and what would unblock it.

3. Functional Requirements
3.1 Tier Definition Table
A central, data-driven mapping of tier → included features, referencing the phase boundaries: Free = Foundation + Planning Core; Starter = + Cost Core + Accountability Layer; Business = + Documentation Engine + Collaboration Layer + Reporting Layer; Enterprise = + Administration & Governance + Integrations.
Every feature must be enumerated as a discrete feature_key, not left as an implicit assumption (e.g., cost_core.evm_engine, governance.sso, documentation.status_report).
3.2 Feature Gate Enforcement
Every gated action checks the organization's current tier via a shared function, called at the API/service layer.
UI-only gating is explicitly insufficient — a direct API call must be blocked exactly the same way a UI action would be.
3.3 Usage Limits
Distinct from feature gates: a quantity ceiling (e.g., Free = 3 users, 1 active project) rather than an on/off capability switch.
Enforced at creation-time for the limited resource (e.g., attempting to create a 2nd active project on Free).
3.4 Upgrade Prompting
A blocked action surfaces a specific message naming the exact feature/limit and the tier that would unlock it — never a generic "permission denied."
3.5 Downgrade Handling
Data exceeding a new tier's limits after a downgrade becomes read-only/locked, never deleted.
The organization retains full visibility into what's locked and why, with a clear path to re-upgrade and regain access.

4. Acceptance Criteria
Every feature across Phases 1–9 is mapped to exactly one tier in the tier-definition table, with zero unmapped or ambiguously-gated features.
A direct API call attempting a gated action on an insufficient tier is blocked identically to a UI-driven attempt.
A Free-tier organization attempting to create a second active project receives a specific, actionable upgrade message.
Downgrading a tier locks (never deletes) any data exceeding the new tier's limits, verified in an explicit downgrade test.

5. Non-Functional & Security Requirements
Requirement
Detail
Enforcement Layer
Must live at the API/service layer — this is a monetization-integrity requirement, not a UX nicety.
Performance
Tier checks run on nearly every API call in the platform; must add negligible latency (target: sub-5ms overhead per check).
Data Integrity
No downgrade path may ever delete data — lock/read-only is the only acceptable degradation path.
Auditability
Tier changes (upgrade, downgrade, manual override) must be logged, feeding Sprint 31's back office and reusing Administration & Governance's Sprint 23 audit log pattern.


6. Implementation Task Breakdown: Sprint 29
[Phase 1: Tier & Subscription Schema] ──> [Phase 2: Feature-Gate Enforcement] ──> [Phase 3: Usage Limits] ──> [Phase 4: Upgrade Prompting & Downgrade Handling]

Phase 1: Tier & Subscription Schema
Goal: Provision the central tables everything else in this phase reads from.
[ ] Task 1.1: Design Tier Schema


Create public.subscription_tiers (id, name, price_per_seat, billing_cycle) and public.tier_feature_map (tier_id, feature_key, enabled).
[ ] Task 1.2: Design Organization Subscription Schema


Create public.organization_subscriptions (id, organization_id, tier_id, seat_count, status [active/past_due/canceled], current_period_end).
[ ] Task 1.3: Enumerate Every Gateable Feature


Walk Phases 2–9 systematically and produce a complete feature_key list — this is a full audit, not a best-effort pass, since a missed feature means a monetization gap.
Phase 2: Feature-Gate Enforcement
Goal: Build and retrofit the enforcement mechanism across the entire existing codebase.
[ ] Task 2.1: Build the Shared Access-Check Function


Implement checkFeatureAccess(organization_id, feature_key), returning allow/deny plus the specific tier required if denied.
[ ] Task 2.2: Retrofit Every Gated Endpoint


Add the access check to every API endpoint corresponding to a Phase 3–9 feature — track this as a checklist against Task 1.3's enumeration to confirm full coverage.
Phase 3: Usage Limits
Goal: Build quantity-based limit enforcement, separate from feature gating.
[ ] Task 3.1: Design Usage Limit Schema


Create public.tier_usage_limits (tier_id, limit_key, max_value).
[ ] Task 3.2: Build Limit-Check Logic


Implement creation-time checks for limited resources (seats, active projects), distinct from Phase 2's capability gating.
Phase 4: Upgrade Prompting & Downgrade Handling
Goal: Make blocked actions informative, and make downgrades safe.
[ ] Task 4.1: Build the Upgrade Prompt Component


A reusable UI component parameterized by the specific feature/limit hit and the tier that would resolve it.
[ ] Task 4.2: Implement Downgrade Lock Behavior


Build the read-only lock state for data exceeding a new tier's limits, with clear in-app messaging about what's locked and why.

7. Sprint Delivery Milestones
Milestone 1 — Schema & Feature Enumeration Complete (Target: Day 3) Tier/subscription schema deployed; every feature across Phases 1–9 enumerated into feature_key values with zero gaps.
Milestone 2 — Enforcement Retrofit Complete (Target: Day 8) Every gated endpoint across Phases 3–9 calls the access-check function; direct API bypass attempts are correctly blocked.
Milestone 3 — Usage Limits Working (Target: Day 10) Seat and active-project limits correctly enforced at creation-time, independent of feature gating.
Milestone 4 — Prompting, Downgrade Safety & Sprint Sign-Off (Target: Day 12) Upgrade prompts are specific and actionable; downgrades correctly lock rather than delete data; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Seat counting definition: does a seat count every invited user regardless of role, or only edit-level roles? Recommend counting only Team Member/PM/Admin as seats, with Viewer/Client access free and unlimited, matching the "unlimited free guests" pattern common across competitors.
Mid-cycle upgrade proration: immediate proration vs. next-renewal effective date? Recommend immediate proration as standard SaaS practice, to be confirmed against Sprint 30's payment processor capabilities.
Retrofit sequencing risk: given Task 2.2 touches every existing endpoint across 7 prior phases, should this be done phase-by-phase with regression testing after each, or as one large pass? Recommend phase-by-phase — a single large retrofit pass across 7 phases' worth of endpoints is exactly the kind of change where an incremental, testable sequence catches mistakes before they compound.

End of Sprint 29 PRD. This sprint's feature_key enumeration (Task 1.3) is the single most important artifact in this entire phase — every subsequent sprint, and the tier pricing story itself, depends on this list being complete and accurate.

Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.

