Product Requirements Document (PRD)
Sprint 11: Accountability Layer — Risk & Issue Register

1. Objective & Scope
The objective of Sprint 11 is to build structured risk and issue tracking — turning informal "this might slip" concerns into owned, scored, trackable records, and connecting identified risk back to the budget contingency already tracked in Cost Core. This is the final sprint in the Accountability Layer phase.
By the end of this sprint, a Project Manager will be able to:
Log risks with probability/impact scoring and a chosen response strategy
Assign a real owner to every risk and issue, drawn from the Sprint 9 stakeholder register
See risks prioritized by calculated score, not buried in entry order
Earmark contingency reserve against specific risks, and see how much reserve remains uncommitted
Log issues, optionally linked to the risk that materialized into them
Out of scope for this sprint: auto-generated, formatted risk register documents (later Documentation Engine phase), risk-adjusted automatic schedule/budget suggestions, formal contingency consumption transactions (this sprint only allows soft earmarking, not actually drawing down reserve against actuals), and notifications/alerts on risk or issue status changes (Collaboration Layer phase).
Hard dependency: This sprint requires Sprint 9 (Stakeholder Register) for risk/issue ownership, and Sprint 5 (Budget Baseline) for the contingency reserve that risks can be linked against. It reuses the stakeholder-assignment interaction pattern established in Sprint 10 (RACI), though risk/issue ownership is a simpler single-owner relationship, not a full RACI matrix.

2. User Stories
As a Project Manager, I want to log risks with a probability and impact score, so that I can prioritize which ones actually deserve attention instead of treating every worry equally.
As a Project Manager, I want every risk and issue to have a real owner from my stakeholder register, so that "someone should look into this" becomes "this specific person is looking into this."
As a Project Manager, I want to see how much of my contingency reserve is allocated against identified risks, so that my reserve isn't just a disconnected number sitting in the budget.
As a Project Manager, I want to log issues and optionally connect them to the risk that caused them, so that I can see which risks are actually materializing versus staying hypothetical.

3. Functional Requirements
3.1 Risk Register
Each risk entry captures:
Title and description
Probability (scored — scale decided per Section 8)
Impact (same scale as probability)
Risk score, calculated automatically as probability × impact
Response strategy: avoid, mitigate, transfer, or accept
Status: e.g., identified, monitoring, mitigating, closed, occurred
Owner: a single stakeholder from the Sprint 9 register (a simpler single-owner relationship than Sprint 10's full RACI — a risk needs one clear owner, not a distributed matrix)
Risk score recalculates automatically if probability or impact is edited — no manual trigger.
3.2 Issue Log
Each issue entry captures:
Title and description
Date raised
Status: e.g., open, in progress, resolved
Owner: a single stakeholder from the Sprint 9 register
Optional link to a related risk (an issue is often a risk that materialized)
3.3 Risk-to-Contingency Linkage
Allow a risk to optionally reference an amount of the project's contingency reserve (from Sprint 5) as its allocated buffer.
Display, at the project level, total contingency, amount allocated against identified risks, and remaining uncommitted reserve.
This is a soft allocation only — it marks intent and visibility, and does not move money or alter the contingency total itself; actual consumption tracking is explicitly out of scope for this sprint.
3.4 Risk-to-WBS/Activity Linkage
Optionally link a risk to the specific WBS element(s) or activity(ies) it threatens, so risk tracking isn't only ever abstract at the project level.
3.5 Prioritized Risk View
A sortable/filterable view of all risks by calculated risk score, so the highest-priority risks are immediately visible.
Support filtering by status and response strategy, so a PM can, for example, see only actively-monitored high-score risks.

4. Acceptance Criteria
A PM can log 10 risks with probability/impact scoring and response strategies, each with a real owner from the stakeholder register, in under 15 minutes.
Risk score is calculated correctly and consistently (probability × impact), and the prioritized view correctly sorts by that score, updating immediately if probability or impact changes.
Allocating a portion of contingency reserve to a risk correctly reduces the visible "uncommitted" reserve amount shown in the Cost Core budget view, without altering the total contingency figure itself.
An issue linked to a risk correctly displays that relationship in both directions — viewing the risk shows its linked issues, and viewing the issue shows its linked risk.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
risks and issues inherit the same project-scoped RLS pattern established across every prior phase.
Correctness
Risk score calculation must be exact and consistent — this is the number that drives prioritization, so a calculation error directly undermines the sprint's core value.
Data Integrity
Risk.allocated_contingency_amount must never allow the sum of all risks' allocations to exceed the project's total contingency without at least a visible warning — silently allowing over-allocation defeats the purpose of visibility.
Non-Financial-Transaction Boundary
Contingency allocation from this sprint must be clearly architected as a soft/advisory link, not a ledger transaction — it must not be possible to mistake it for an actual budget consumption event when this data is read by a future phase.
Extensibility
Schema must not block a later Documentation Engine phase from generating a formatted risk register export, or a later governance phase from converting soft contingency allocation into a real consumption transaction, without a breaking migration.


6. Implementation Task Breakdown: Sprint 11
[Phase 1: Risk & Issue Schema & RLS] ──> [Phase 2: Risk Register CRUD] ──> [Phase 3: Issue Log CRUD] ──> [Phase 4: Contingency Linkage] ──> [Phase 5: Prioritized Views]

Phase 1: Risk & Issue Schema & Row Level Security
Goal: Provision the tables that hold risk and issue data, linked to the stakeholder register (Sprint 9) and budget contingency (Sprint 5).
[ ] Task 1.1: Design Risk Schema


Create a SQL migration for public.risks (id, project_id, title, description, probability, impact, risk_score [computed], response_strategy enum [avoid/mitigate/transfer/accept], status, owner_stakeholder_id FK, allocated_contingency_amount [nullable], linked_wbs_element_id [nullable FK]).
[ ] Task 1.2: Design Issue Schema


Create public.issues (id, project_id, title, description, raised_date, status, owner_stakeholder_id FK, linked_risk_id [nullable FK]).
[ ] Task 1.3: Configure Row Level Security


Enable RLS on both tables, reusing the organization_members-scoped pattern established since Sprint 1.
Phase 2: Risk Register CRUD
Goal: Let a PM log and manage risks with proper scoring and ownership.
[ ] Task 2.1: Build Risk Entry Form


Form capturing title, description, probability, impact, response strategy, status, and owner (picker sourced from Sprint 9's stakeholder register).
[ ] Task 2.2: Implement Risk Score Calculation


Auto-calculate risk_score = probability × impact on save, and recalculate immediately if either input changes.
[ ] Task 2.3: Build Risk List View


Table/card view of all risks with status and response strategy visible at a glance.
Phase 3: Issue Log CRUD
Goal: Let a PM track issues as they arise, connected to risk where relevant.
[ ] Task 3.1: Build Issue Entry Form


Form capturing title, description, date raised, status, owner, and optional linked risk.
[ ] Task 3.2: Implement Bidirectional Risk-Issue Linking


Ensure the link is queryable and displayable from both sides — a risk's detail view lists its linked issues, and an issue's detail view shows its linked risk.
Phase 4: Contingency Linkage
Goal: Connect risk tracking back to the Cost Core budget, transparently and without touching actual financial transactions.
[ ] Task 4.1: Build Contingency Allocation UI


On a risk's detail view, allow entering an allocated_contingency_amount, sourced from and validated against the project's total contingency (Sprint 5).
[ ] Task 4.2: Implement Over-Allocation Warning


Calculate the sum of all risks' allocated amounts against total contingency; surface a clear warning if the sum would exceed the total, without hard-blocking the action (a PM may have valid reasons to over-plan against contingency and reassess).
[ ] Task 4.3: Surface Contingency Summary in Cost Core Views


Add a summary (total contingency, allocated, remaining uncommitted) to the existing Sprint 5 budget view, without altering the underlying contingency total itself.
Phase 5: Prioritized Risk Views
Goal: Make the risk register genuinely usable for triage, not just data entry.
[ ] Task 5.1: Build Risk Score Sorting


Default risk list view sorted by risk score descending.
[ ] Task 5.2: Build Status/Response Strategy Filtering


Filter controls for status and response strategy, combinable with the score sort.
[ ] Task 5.3: Build Optional WBS/Activity Linkage UI


Allow linking a risk to specific WBS elements/activities, surfaced as an optional field on the risk entry form.

7. Sprint Delivery Milestones
Milestone 1 — Risk & Issue Data Layer Live (Target: Day 3) risks and issues tables deployed with RLS confirmed; both correctly reference stakeholder ownership from Sprint 9.
Milestone 2 — Risk Register Working (Target: Day 6) Risks can be logged with correct, live-recalculating risk scores and real stakeholder ownership; risk list view functions correctly.
Milestone 3 — Issue Log & Linkage Working (Target: Day 8) Issues can be logged and linked bidirectionally to risks; both sides of the relationship display correctly.
Milestone 4 — Contingency Linkage, Prioritization & Sprint Sign-Off (Target: Day 10) Contingency allocation and over-allocation warnings work correctly and are visible in Cost Core's budget view without altering the underlying total; prioritized/filterable risk view is functional; all Section 4 acceptance criteria pass — this milestone closes out the entire Accountability Layer phase.

8. Open Questions Carried Into This Sprint
Probability/impact scale: as flagged in the Phase 4 PRD, should this use a simple 1–5 scale or a more granular/configurable scale? This should be decided consistently with whatever was chosen for Sprint 10 if risk scoring shares any UI patterns with RACI, though the two are functionally independent. Recommend a simple 1–5 scale for launch, with configurability flagged as a future enhancement.
Over-allocation behavior: Task 4.2 recommends a warning rather than a hard block — confirm this matches product intent, since some organizations may want a hard cap on contingency allocation for governance reasons.
Risk status lifecycle: what are the exact allowed status values and transitions (e.g., can a risk go from "closed" back to "monitoring," or is that a new risk entry)? Worth defining the state machine explicitly before Task 2.1, rather than leaving status as an unconstrained free-text field.
Single owner vs. RACI for risks: Section 3.1 deliberately scopes risk ownership as a single stakeholder rather than a full RACI matrix. Confirm this simpler model is sufficient, or whether some organizations will want Consulted/Informed parties on a risk as well (which would mean reusing Sprint 10's raci_assignments pattern instead of a dedicated owner_stakeholder_id field).

End of Sprint 11 PRD. This sprint completes the Accountability Layer phase (Stakeholder Register → RACI Matrix → Risk & Issue Register). The platform now has a full picture of scope, schedule, cost, and accountability, all connected through the same WBS spine. The next phase in the platform's build sequence is the Documentation Engine: auto-generated, continuously-updated project documents pulled from all of the data built across Foundation, Planning Core, Cost Core, and this phase.

