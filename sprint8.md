Product Requirements Document (PRD)
Sprint 8: Cost Core — EVM Engine

1. Objective & Scope
The objective of Sprint 8 is to build the Earned Value Management (EVM) calculation engine — the payoff of the entire Cost Core phase, combining budget (Sprint 5), resource-driven planned cost (Sprint 6), actuals (Sprint 7), and schedule progress (Phase 2) into a single, live set of financial performance metrics.
By the end of this sprint, the system will be able to:
Calculate PV, EV, AC, CV, SV, CPI, SPI, EAC, ETC, VAC, and TCPI — automatically, per work package and rolled up to the project
Keep every metric live and current the instant budget, actuals, or schedule progress changes
Store historical snapshots so trend-over-time reporting is possible once dashboards exist in a later phase
Out of scope for this sprint: any dashboard or chart visualization of these metrics (that belongs to the Reporting & Dashboards module per the master PRD's Section 5.9) and alternative EAC formula variants beyond the standard formula. This sprint is deliberately headless, exactly like the Sprint 3 CPM engine — correctness is proven against known reference numbers before any visual layer is built on top.
Hard dependency: This sprint requires all three of Sprint 5 (Budget Baseline), Sprint 6 (Resource Rates), and Sprint 7 (Actuals) to be complete, plus Sprint 3's percent_complete field on schedule activities. EVM is the one sprint in this entire platform that depends on the full breadth of what's been built so far — there is no meaningful partial version of this sprint.

2. User Stories
As a Project Manager, I want to see my project's Cost and Schedule Performance Indexes (CPI, SPI) at any time, so that I know immediately whether I'm over or under budget, and ahead or behind schedule, in one number each.
As a Project Manager, I want an Estimate at Completion (EAC) calculated automatically, so that I can forecast final project cost instead of only looking backward at what's already been spent.
As a Project Manager, I want these metrics to update the instant budget, actuals, or schedule progress change, so that I'm never making decisions on stale numbers.
As a Project Manager, I want to drill from a project-level metric down to the specific work package causing the variance, so that I can act on the number instead of just observing it.

3. Functional Requirements
3.1 Core EVM Metrics
Calculate the following per WBS work package, and rolled up to the project level:
PV (Planned Value): budgeted cost of work scheduled to date, read from Sprint 5's time-phased budget baseline as of the current date.
EV (Earned Value): budgeted cost of work actually performed — calculated as the work package's baseline total × its activity's percent_complete (from Sprint 3).
AC (Actual Cost): actual cost to date, summed from Sprint 7's actual_costs for the work package.
CV (Cost Variance) = EV − AC
SV (Schedule Variance) = EV − PV
CPI (Cost Performance Index) = EV ÷ AC
SPI (Schedule Performance Index) = EV ÷ PV
3.2 Forecasting Metrics
EAC (Estimate at Completion): support the standard formula — AC + (remaining budget ÷ CPI). Other EAC formula variants (e.g., assuming atypical future performance) are flagged as a future enhancement, not launch scope.
ETC (Estimate to Complete) = EAC − AC
VAC (Variance at Completion) = Budget at Completion − EAC
TCPI (To-Complete Performance Index) = remaining work ÷ remaining budget
3.3 Live Recalculation
All metrics recalculate automatically whenever budget (Sprint 5), actuals (Sprint 7), or schedule progress (percent_complete from Sprint 3) changes.
There is no manual "recalculate" step — this mirrors the live-recalculation requirement already established for the Sprint 3 CPM engine, and is equally non-negotiable here.
3.4 Roll-Up
Every metric is available at the work-package level and rolled up to the project level, so a PM can drill into exactly where cost or schedule performance is breaking down rather than only seeing a single project-wide number.
3.5 Historical Snapshots
Store periodic EVM snapshots — not just live current values — so trend-over-time reporting is possible once dashboards are built in a later phase.
Snapshot frequency (every recalculation event vs. a scheduled cadence) is an open decision — see Section 8.

4. Acceptance Criteria
On a known reference EVM scenario (a standard PMBOK-style worked example with pre-calculated PV/EV/AC/CPI/SPI/EAC), the engine's output matches expected values exactly.
Entering a new actual cost against a work package correctly and immediately updates that work package's and the project's AC, CV, CPI, EAC, and VAC — with no manual trigger.
A change in an activity's percent_complete correctly updates EV, SV, and SPI without requiring any budget or actuals change.
Every metric is drillable from the project-level roll-up down to the specific work package driving a variance.

5. Non-Functional & Security Requirements
Requirement
Detail
Performance
EVM recalculation for a 5,000-activity project completes in under 2 seconds, matching the CPM engine's performance bar from Sprint 3.
Correctness
This is the financial equivalent of the CPM engine's "roughly right isn't acceptable" requirement — every formula must match reference calculations exactly, with no silent rounding drift across a large roll-up.
Data Integrity
EVM calculations must always read from the authoritative source tables (budget_baselines, actual_costs, activities.percent_complete) — never from a cached or duplicated copy that could drift out of sync.
Data Isolation
evm_snapshots inherits the same project-scoped RLS pattern established across every prior sprint in this phase.
Auditability
Every stored snapshot is immutable once written and timestamped, so historical performance reporting can never be retroactively altered.


6. Implementation Task Breakdown: Sprint 8
[Phase 1: EVM Schema & Snapshot Model] ──> [Phase 2: Core Metric Calculation] ──> [Phase 3: Forecasting Metrics] ──> [Phase 4: Live Recalculation & Roll-Up] ──> [Phase 5: Reference Validation & QA]
Phase 1: EVM Schema & Snapshot Model
Goal: Provision the table that stores calculated EVM values, both live and historical.
Task 1.1: Design EVM Snapshot Schema
Create a SQL migration for public.evm_snapshots (id, wbs_element_id [nullable = project-level rollup], calculated_at, pv, ev, ac, cv, sv, cpi, spi, eac, etc, vac, tcpi).
Task 1.2: Configure Row Level Security
Enable RLS on evm_snapshots, reusing the organization_members-scoped pattern established across Sprints 1–7.
Task 1.3: Enforce Snapshot Immutability
Ensure no update path can modify a written snapshot — only new snapshot rows can be created, matching the immutability requirement already established for budget baselines in Sprint 5.
Phase 2: Core Metric Calculation (PV, EV, AC, CV, SV, CPI, SPI)
Goal: Implement the foundational EVM metrics that everything else in this sprint builds on.
Task 2.1: Implement PV Calculation
Read time-phased budget entries from Sprint 5 as of the current date to compute Planned Value per work package.
Task 2.2: Implement EV Calculation
Combine the work package's baseline total with its activity's percent_complete (Sprint 3) to compute Earned Value.
Task 2.3: Implement AC Aggregation
Sum actual_costs (Sprint 7) per work package to compute Actual Cost.
Task 2.4: Implement CV, SV, CPI, SPI
Calculate all four derived metrics from PV/EV/AC, handling edge cases explicitly (e.g., AC or PV = 0, which would otherwise produce a division error).
Phase 3: Forecasting Metrics (EAC, ETC, VAC, TCPI)
Goal: Build the forward-looking metrics that turn historical performance into a completion forecast.
Task 3.1: Implement EAC
Calculate using the standard formula (AC + remaining budget ÷ CPI).
Task 3.2: Implement ETC and VAC
Derive both directly from EAC and the budget-at-completion figure.
Task 3.3: Implement TCPI
Calculate as remaining work ÷ remaining budget, handling the edge case where remaining budget is zero or negative.
Phase 4: Live Recalculation & Roll-Up
Goal: Make the engine reactive and drillable, mirroring the CPM engine's live-recalculation behavior.
Task 4.1: Wire Automatic Recalculation Triggers
Trigger a full recalculation whenever budget, actuals, or percent_complete changes — no manual trigger required.
Task 4.2: Implement Project-Level Roll-Up
Aggregate work-package-level metrics into a single project-level evm_snapshots row (wbs_element_id = null).
Task 4.3: Build Drill-Down Data Access
Ensure the project-level roll-up can be traced back to the specific work-package rows driving any given variance, supporting the drill-down acceptance criterion.
Phase 5: Reference Validation & QA
Goal: Prove the engine is correct before it's relied on for any real financial decision-making.
Task 5.1: Build Reference Scenario Test Suite
Encode a standard PMBOK-style worked EVM example with known PV/EV/AC/CPI/SPI/EAC values, and assert exact match.
Task 5.2: Live Update Regression Tests
Test that a new actual cost entry and a percent_complete change each correctly and independently update the expected subset of metrics.
Task 5.3: Edge Case Testing
Test zero/negative AC, PV, and remaining-budget scenarios to confirm the engine handles them gracefully (no crashes, no divide-by-zero errors, sensible output values or explicit "not applicable" states).

7. Sprint Delivery Milestones
Milestone 1 — EVM Schema Live (Target: Day 3) evm_snapshots table deployed with RLS confirmed; immutability enforced.
Milestone 2 — Core Metrics Correct (Target: Day 6) PV, EV, AC, CV, SV, CPI, and SPI all match the reference scenario test suite exactly, including edge case handling.
Milestone 3 — Forecasting Metrics Correct (Target: Day 9) EAC, ETC, VAC, and TCPI all match the reference scenario exactly; live recalculation is fully wired across budget, actuals, and schedule progress changes.
Milestone 4 — Roll-Up, Drill-Down & Sprint Sign-Off (Target: Day 12) Project-level roll-up and work-package drill-down both function correctly; full reference-scenario and regression test suite passes; all Section 4 acceptance criteria pass — this milestone closes out the entire Cost Core phase.

8. Open Questions Carried Into This Sprint
Snapshot write frequency: should evm_snapshots be written on every recalculation event (potentially very frequent — every actual cost entry or progress update) or on a scheduled cadence (e.g., daily)? Every-event snapshotting gives perfect history but may create excessive storage/write volume at scale — recommend resolving this before Task 4.1, since it affects how the recalculation trigger is wired.
Edge case display behavior: when AC or PV is zero (making CPI/SPI mathematically undefined), should the UI eventually show "N/A," a blank, or a specific sentinel value? This sprint only needs to decide what the engine returns in that case — the display decision itself belongs to the future dashboard phase, but the engine's contract needs to be settled now.
Percent-complete source of truth: confirm percent_complete is always manually entered by the PM (as scoped in Sprint 3) and not, in some future state, auto-derived from actual cost as a percentage of budget — conflating the two would make EV circular and meaningless. Worth an explicit note in engineering onboarding, not just this document.
Rollup granularity beyond project-level: is work-package-level and project-level roll-up sufficient for this sprint, or should intermediate WBS summary levels (e.g., a phase halfway up the hierarchy) also get their own evm_snapshots row? Useful for later dashboards, but adds real scope if required now — recommend deferring intermediate rollups unless there's a known near-term need.

End of Sprint 8 PRD. This sprint completes the Cost Core phase (Budget Baseline → Resource Rates → Actuals → EVM Engine). The full financial performance picture — planned, spent, earned, and forecast — is now live and connected to the same WBS and schedule spine established in Planning Core. The next phase in the platform's build sequence is the Accountability Layer: RACI, stakeholder register, and risk register, per the master PRD's Section 12 build sequence.

