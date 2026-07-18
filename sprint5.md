Product Requirements Document (PRD)
Sprint 5: Cost Core — Budget Baseline

1. Objective & Scope
The objective of Sprint 5 is to build budget estimation and baselining — the cost equivalent of what the WBS (Sprint 2) did for scope and the schedule baseline (Sprint 3) did for time.
By the end of this sprint, a Project Manager will be able to:
Estimate cost for each WBS work package using analogous, parametric, or bottom-up methods
See that estimate distributed over time against the work package's schedule, producing a project-level S-curve
Save a named, time-phased budget baseline as a fixed reference point
Track contingency and management reserve separately from work-package estimates
Out of scope for this sprint: resource-based cost calculation (Sprint 6 builds resource rates; bottom-up estimates in this sprint are entered manually and get reconciled once resource assignments exist), actual cost tracking (Sprint 7), and EVM metrics (Sprint 8) — this sprint only produces the planned side of the cost equation.
Hard dependency: This sprint requires Sprint 3 (Schedule / CPM Engine) to be complete, since time-phasing a budget requires each work package's scheduled dates. It also assumes Sprint 2's WBS is stable, since every cost account attaches to a wbs_element_id, never to a schedule Activity directly — this boundary is intentional and must not be violated by this sprint's schema.

2. User Stories
As a Project Manager, I want to estimate cost for each work package using the method that fits how much detail I have, so that early-stage estimates don't force me to fake precision I don't have yet.
As a Project Manager, I want my budget distributed over time to match my schedule, so that I can see whether spending is front-loaded, even, or back-loaded before the project even starts.
As a Project Manager, I want to save a named budget baseline, so that I have a fixed reference point to compare actual spending against later, no matter how many times the live budget changes.
As a Project Manager, I want contingency and management reserve tracked separately from my work-package estimates, so that I always know how much buffer is left and haven't accidentally spent it without noticing.

3. Functional Requirements
3.1 Cost Estimation Methods
Every WBS element flagged as a work package can have a cost estimate, using one of three methods:
Analogous: a single estimated total, optionally referencing a comparable past project/element for justification (free-text reference, not a hard link in this sprint).
Parametric: rate × quantity (e.g., $/sq ft × sq ft), with rate and quantity stored as separate fields so the calculation is transparent and auditable.
Bottom-up: intended to sum resource-based costs once Sprint 6 ships; until then, bottom-up estimates in this sprint are entered as a manual total, explicitly flagged as "pending resource reconciliation."
Each cost account records its estimation method, so it's always clear how a number was derived, not just what the number is.
3.2 Time-Phased Distribution & S-Curve
Distribute each work package's budgeted total across its scheduled duration (from Sprint 3), producing a time-phased cost curve.
Support at minimum a linear/even distribution across the work package's scheduled dates; support a manual override of the distribution shape for work packages where spending isn't even (e.g., front-loaded procurement).
Roll up all work-package time-phased distributions into a single project-level cumulative S-curve.
3.3 Budget Baseline
Support saving a named budget baseline (e.g., "Approved Budget," "Q3 Re-baseline") at any point.
A saved baseline freezes both the total and the time-phased distribution per work package — later edits to the live budget must never retroactively change a saved baseline.
Support multiple saved baselines per project, mirroring the schedule baseline pattern already established in Sprint 3.
3.4 Contingency & Management Reserve
Support a distinct contingency amount, trackable at the project level or per phase, kept separate from individual work-package estimates.
Show remaining contingency/reserve clearly, so a PM always knows how much buffer is left as changes consume it (consumption mechanics beyond simple manual deduction are out of scope this sprint — full change-request-driven consumption belongs to a later governance phase).
3.5 Multi-Currency
Every cost account records an explicit currency.
The project has a primary currency for roll-up reporting.
Conversion behavior (rate-locked-at-baseline vs. live-rate-at-report-time) is an open decision — see Section 8 — but the schema must support either without a breaking migration.

4. Acceptance Criteria
A PM can build a budget for a 20-work-package project using a mix of analogous, parametric, and bottom-up (manual/pending) estimates, and see the total roll up correctly to the project level.
The project-level S-curve correctly matches the sum of all work-package time-phased distributions, and updates correctly if a work package's schedule dates change.
Saving a budget baseline correctly freezes the time-phased distribution — a subsequent edit to the live budget must not alter the saved baseline's stored values.
Contingency amount is tracked separately from work-package totals and is never silently included in the "planned cost" roll-up used elsewhere in the product.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
cost_accounts, time_phase_entries, and budget_baselines must inherit the same project-scoped RLS pattern established in Sprints 1–3 — no cross-project or cross-tenant access.
Correctness
S-curve and baseline totals must always exactly match the sum of their underlying work-package entries — no rounding drift or silent discrepancy between a work package's total and its time-phased distribution sum.
Data Integrity
A saved baseline must be immutable — no code path, including admin tooling, should be able to silently mutate a BaselineCostSnapshot after it's saved.
Extensibility
Schema must not block Sprint 6 (Resource Rates) from reconciling bottom-up estimates, or Sprint 8 (EVM) from reading budget_baselines as the source of Planned Value, without a breaking migration.


6. Implementation Task Breakdown: Sprint 5
[Phase 1: Cost Account Schema & RLS] ──> [Phase 2: Estimation Methods] ──> [Phase 3: Time-Phasing & S-Curve] ──> [Phase 4: Baseline Snapshotting] ──> [Phase 5: Contingency & Multi-Currency]
Phase 1: Cost Account Schema & Row Level Security
Goal: Provision the tables that hold budget data, linked to the WBS from Sprint 2, with the same tenant-isolation guarantees as the rest of the platform.
Task 1.1: Design Cost Account Schema
Create a SQL migration for public.cost_accounts (id, wbs_element_id FK, estimation_method enum [analogous/parametric/bottom_up], budgeted_total, currency, reconciliation_status [for bottom-up pending state]).
Create public.time_phase_entries (id, cost_account_id FK, period_date, planned_amount).
Task 1.2: Enforce Structural Integrity
Ensure cost_accounts.wbs_element_id can only reference a WBS element flagged is_work_package = true, rejecting attachment to a summary/grouping element.
Task 1.3: Configure Row Level Security
Enable RLS on cost_accounts and time_phase_entries, reusing the organization_members-scoped pattern from Sprint 1–3.
Restrict write access to Admin/PM roles; Team Member and Viewer get read-only access (budget data is commonly more restricted than schedule data — confirm this default with stakeholders, see Section 8).
Phase 2: Cost Estimation Methods
Goal: Let a PM enter an estimate for a work package using whichever method fits, with the method itself recorded for transparency.
Task 2.1: Build Analogous Estimation Input
Form for entering a single total plus an optional free-text comparable-project reference.
Task 2.2: Build Parametric Estimation Input
Form capturing rate and quantity as separate fields, with the total calculated (not manually entered) so the derivation stays transparent.
Task 2.3: Build Bottom-Up Placeholder Input
Form for entering a manual total, explicitly flagged as "pending resource reconciliation" in the UI and data (reconciliation_status), preparing for Sprint 6's resource-based recalculation.
Phase 3: Time-Phasing & S-Curve Calculation
Goal: Distribute budget over time in a way that's consistent with the schedule, and roll it up into a usable project-level view.
Task 3.1: Implement Linear Distribution
Given a work package's scheduled start/finish (from Sprint 3) and its budgeted total, generate an even time-phased distribution across that date range.
Task 3.2: Support Manual Distribution Override
Allow a PM to manually adjust the time-phased shape for a specific work package (e.g., front-loaded), while keeping the total consistent with the cost account's budgeted_total.
Task 3.3: Build Project-Level S-Curve Roll-Up
Aggregate all work-package time-phased entries into a single cumulative project-level curve, recalculating automatically if a work package's schedule dates or budget change.
Phase 4: Budget Baseline Snapshotting
Goal: Let a PM freeze a version of the budget, exactly mirroring the schedule baseline pattern from Sprint 3.
Task 4.1: Build Baseline Save Logic
Create public.budget_baselines (id, project_id, name, saved_at) and public.baseline_cost_snapshots (baseline_id, wbs_element_id, baseline_total, baseline_time_phase [serialized or joined table]).
On save, copy every current cost_account/time_phase_entry value into the snapshot — never a live reference.
Task 4.2: Enforce Baseline Immutability
Ensure no update path (including admin tooling) can modify a baseline_cost_snapshot after creation; only a new baseline save can supersede it.
Task 4.3: Support Multiple Named Baselines
Allow multiple baselines per project, each independently viewable and comparable.
Phase 5: Contingency & Multi-Currency
Goal: Round out the sprint with the two cross-cutting requirements that touch every cost account.
Task 5.1: Build Contingency/Reserve Tracking
Create a project- or phase-level contingency field, tracked and displayed separately from the sum of work-package totals.
Task 5.2: Implement Multi-Currency Fields
Add currency to cost_accounts, and a primary_currency to the project record.
Implement currency conversion for roll-up display per the decision reached in Section 8 (rate-locked vs. live-rate).

7. Sprint Delivery Milestones
Milestone 1 — Cost Data Layer Live (Target: Day 3) cost_accounts and time_phase_entries tables deployed with RLS confirmed; a cost account can be created and linked to a WBS work package (and rejected for non-work-package elements).
Milestone 2 — Estimation & Time-Phasing Working (Target: Day 6) All three estimation methods (analogous, parametric, bottom-up placeholder) can be entered; time-phased distribution generates correctly from schedule dates, including manual override.
Milestone 3 — S-Curve & Baseline Save (Target: Day 9) Project-level S-curve correctly aggregates all work packages; a budget baseline can be saved and is confirmed immutable against subsequent live-budget edits.
Milestone 4 — Contingency, Currency & Sprint Sign-Off (Target: Day 12) Contingency tracking and multi-currency fields are functional; all Section 4 acceptance criteria pass, including the 20-work-package end-to-end build scenario.

8. Open Questions Carried Into This Sprint
Currency conversion timing: should a cost account's currency be converted to the project's primary currency at baseline-save time (rate-locked) or live at report-view time (current rate)? This affects whether a saved baseline's roll-up total can shift purely due to FX movement — recommend resolving before Task 5.2, since it changes the schema (a locked rate needs to be stored per snapshot).
Bottom-up reconciliation UX: when Sprint 6 ships and a "pending reconciliation" bottom-up estimate gets a real resource-calculated total, should the system auto-overwrite the manual number or flag a variance for the PM to confirm? Recommend flag-and-confirm, consistent with the same recommendation made in the parent Phase 3 PRD.
Budget visibility default: should Team Member/Viewer roles have read access to budget data by default, or should budget be Admin/PM-only unless explicitly shared? Financial data commonly warrants tighter default visibility than schedule data — worth an explicit product decision rather than defaulting to the same RBAC pattern used for schedule/WBS.
Contingency consumption mechanics: this sprint only tracks contingency as a static, manually-adjusted number. Should any lightweight consumption tracking (e.g., linking a contingency draw to a specific work package) be included now, or fully deferred to the later change-request/governance phase?

End of Sprint 5 PRD. This sprint delivers the planned side of the cost equation only — no resource-based cost calculation, no actuals, no EVM. Sprint 6 (Resource Rates) builds the resource cost model that reconciles this sprint's bottom-up placeholders and feeds Sprint 8's EVM engine.

