Product Requirements Document (PRD)
Sprint 7: Cost Core — Actuals Tracking

1. Objective & Scope
The objective of Sprint 7 is to build actual cost tracking — the real-world spending data that gets compared against everything built in Sprints 5 (Budget Baseline) and 6 (Resource Rates). This is the last piece needed before Sprint 8 can calculate EVM, since EVM is fundamentally a comparison of planned value, earned value, and actual cost.
By the end of this sprint, a Project Manager will be able to:
Record actual costs manually as they occur, attributed to a specific WBS element (and optionally an activity or resource assignment)
Bulk-import actual costs from a CSV, the same way WBS data was bulk-imported in Sprint 2
See actual-to-date roll up through the WBS hierarchy, comparable at every level against planned cost
View actual cost alongside schedule percent_complete, setting up exactly the pairing Sprint 8's Earned Value calculation needs
Out of scope for this sprint: live ERP/accounting system integration (this sprint ships an integration-ready hook only — full integrations are a later platform phase) and EVM calculation itself (Sprint 8).
Hard dependency: This sprint requires Sprint 5 (Budget Baseline) for the cost_accounts that actuals get compared against, and Sprint 6 (Resource Rates) for activity_resource_assignments that actuals can optionally be attributed to. It also relies on Sprint 3's percent_complete field on activities, which this sprint surfaces but does not modify.

2. User Stories
As a Project Manager, I want to record actual costs as they occur, so that I can see how spending compares to budget in real time rather than finding out at month-end.
As a Project Manager, I want to import actual costs in bulk from a CSV, so that I don't have to manually re-enter data that already exists in another system, like a timesheet export or accounting extract.
As a Project Manager, I want actual costs linked to specific WBS elements or activities, so that overspending can be traced to exactly where it's happening, not just seen as a project-wide total.
As a Project Manager, I want to see actual cost next to schedule progress for the same activity, so that I can sanity-check whether spending and physical progress are moving together before I even look at a formal EVM report.

3. Functional Requirements
3.1 Manual Actual Cost Entry
Record an actual cost with: amount, currency, date, description, and a required link to a WBS element.
Optionally link an actual cost to a specific activity and/or resource assignment, for more precise attribution (e.g., "this invoice was for the labor assignment on Activity X," not just "this invoice was for Work Package Y").
Support an explicit source field (manual, import, api) so the origin of every actual cost record is always traceable.
3.2 CSV Bulk Import
Support bulk import of actual costs via CSV, with column mapping for date, amount, currency, WBS/activity reference, and description — matching the import UX pattern already established for WBS bulk import in Sprint 2.
Validate each row against existing WBS elements/activities at import time; reject or flag rows that reference an element that doesn't exist, rather than silently creating an "unassigned" actual.
Show a clear import summary (rows succeeded, rows failed with reasons) after every import.
3.3 Integration-Ready Hook
Expose an API endpoint/webhook shape suitable for a future accounting/ERP integration to push actual cost records into.
This sprint does not build the integration itself (no live connection to any specific accounting/ERP system) — only the ingestion contract that a later integration phase can build against, per the master PRD's Section 5.11.
3.4 Roll-Up
Roll up actual costs through the WBS hierarchy, exactly mirroring the planned-cost roll-up pattern from Sprint 5 — a work package, a phase, or the whole project can each show actual-to-date.
Every actual cost must resolve to a valid wbs_element_id; the roll-up must never include an "unassigned" actual that isn't attributable to a specific point in the WBS.
3.5 Schedule Progress Pairing
Display actual cost alongside the linked activity's percent_complete (from Sprint 3), so a PM can see cost and physical progress side by side without needing to wait for Sprint 8's formal EVM calculation.
3.6 Multi-Currency
Actual costs are recorded in their own currency, converting for roll-up display per the same conversion-timing decision made in Sprint 5/6 (rate-locked vs. live-rate — should be applied consistently across all three sprints, not decided independently here).

4. Acceptance Criteria
A PM can manually enter an actual cost against a specific work package and see it immediately reflected in that work package's and the project's actual-cost roll-up.
A CSV import of 100 actual cost records completes and correctly attributes each row to the right WBS element in under 15 seconds, with a clear summary of any rows that failed validation.
Every actual cost record is traceable to a specific WBS element — no code path allows an "unassigned" actual to reach the project total silently.
Actual cost and percent_complete for the same activity are both visible together in at least one view, without requiring navigation between separate screens.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
actual_costs must inherit the same project-scoped RLS pattern established in Sprints 1–3, consistent with the budget/resource tables from Sprints 5–6.
Data Integrity
A wbs_element_id is a required, validated field on every actual_costs row — there is no schema path to an orphaned or unattributed actual cost.
Import Performance
A 100-row CSV import completes in under 15 seconds (matches Acceptance Criteria); larger imports should degrade gracefully with progress feedback, not silently hang.
Auditability
Every actual cost record retains its source (manual/import/api) and a timestamp, so financial data can always be traced back to how it entered the system — this matters more for cost data than almost anything else in the platform.
Extensibility
Schema must not block Sprint 8 (EVM) from reading actual_costs as the source of Actual Cost (AC), or a later ERP integration phase from writing through the api source path without a breaking migration.


6. Implementation Task Breakdown: Sprint 7
[Phase 1: Actuals Schema & RLS] ──> [Phase 2: Manual Entry UI] ──> [Phase 3: CSV Import] ──> [Phase 4: Roll-Up & Progress Pairing] ──> [Phase 5: Integration-Ready API Hook]
Phase 1: Actuals Schema & Row Level Security
Goal: Provision the table that holds actual cost data, linked to the WBS, schedule, and resource layers already in place.
Task 1.1: Design Actual Cost Schema
Create a SQL migration for public.actual_costs (id, wbs_element_id FK [required], activity_id FK [nullable], resource_rate_id FK [nullable], amount, currency, date, description, source enum [manual/import/api], created_at).
Task 1.2: Enforce Attribution Requirement
Ensure wbs_element_id is a non-nullable, validated foreign key — no insert path (manual, import, or API) can succeed without a valid WBS attribution.
Task 1.3: Configure Row Level Security
Enable RLS on actual_costs, reusing the organization_members-scoped pattern from Sprints 1–3 and matching the write-access defaults already established for budget data in Sprint 5.
Phase 2: Manual Actual Cost Entry
Goal: Let a PM record spending as it happens, quickly and with clear attribution.
Task 2.1: Build Manual Entry Form
Form capturing amount, currency, date, description, and WBS element (with optional activity/resource assignment linkage).
Task 2.2: Build Actuals List View
A filterable list of all actual cost records for a project, filterable by WBS element, date range, and source.
Phase 3: CSV Bulk Import
Goal: Let actuals already tracked elsewhere (timesheets, accounting exports) be brought in without manual re-entry.
Task 3.1: Build Column-Mapping Import UI
Reuse the import UX pattern from Sprint 2's WBS bulk import: upload, map columns, preview before committing.
Task 3.2: Implement Row Validation
Validate each row's WBS/activity reference against existing records at import time; reject/flag invalid rows rather than creating unattributed actuals.
Task 3.3: Build Import Summary Reporting
Show a post-import summary: rows succeeded, rows failed, and the specific reason for each failure.
Phase 4: Roll-Up & Schedule Progress Pairing
Goal: Make actual cost data useful immediately, ahead of Sprint 8's formal EVM calculation.
Task 4.1: Build Actuals Roll-Up Logic
Aggregate actual costs through the WBS hierarchy, mirroring Sprint 5's planned-cost roll-up pattern exactly, so the two are always directly comparable at every level.
Task 4.2: Build Cost-vs-Progress View
Surface actual cost alongside percent_complete for the same activity in a single view (e.g., an activity detail panel or a combined table), without requiring separate navigation.
Phase 5: Integration-Ready API Hook
Goal: Prepare the ingestion path for a future ERP/accounting integration without building the integration itself.
Task 5.1: Design the Ingestion Contract
Define the API endpoint/webhook payload shape for external systems to push actual cost records into, reusing the same schema fields as manual/CSV entry.
Task 5.2: Implement the Endpoint (Stubbed Auth/Source Tagging Only)
Build the endpoint with proper authentication and source = 'api' tagging, but without wiring it to any specific third-party system — this sprint delivers the contract, not a live connector.

7. Sprint Delivery Milestones
Milestone 1 — Actuals Data Layer Live (Target: Day 3) actual_costs table deployed with RLS confirmed; attribution requirement enforced at the schema level (no insert path can bypass wbs_element_id).
Milestone 2 — Manual Entry Working (Target: Day 5) PMs can manually record and browse actual costs, correctly attributed and immediately reflected in roll-up totals.
Milestone 3 — CSV Import Working (Target: Day 8) Bulk import of 100 rows completes within the 15-second target, with correct validation and a clear success/failure summary.
Milestone 4 — Roll-Up, Progress Pairing, API Hook & Sprint Sign-Off (Target: Day 12) Actuals roll up correctly and match Sprint 5's roll-up pattern exactly; cost-vs-progress pairing is visible in at least one view; the integration-ready API endpoint is functional and correctly tagged; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Activity-level attribution requirement: Section 3.1 makes wbs_element_id required but activity_id optional. Confirm this is sufficient for Sprint 8's EV calculation, or whether activity-level attribution should be required whenever the WBS element has more than one linked activity (not expected in this phase given the 1:1 WBS-to-activity relationship from Sprint 3, but worth confirming explicitly).
Import failure handling: should a CSV import be all-or-nothing (any invalid row blocks the whole import) or partial (valid rows commit, invalid rows are reported separately)? Partial import is more forgiving but risks a PM not noticing a handful of failed rows — recommend partial import with a prominent, hard-to-miss failure summary.
Currency conversion consistency: confirm the same rate-locked-vs-live-rate decision from Sprint 5 is being applied here without modification — actuals are the sprint most likely to accumulate FX-driven discrepancies over a project's life if this isn't handled identically to the budget/resource sprints.
API hook authentication model: what authentication should the Sprint 7 API endpoint require (API key per project/org, OAuth, etc.)? This doesn't need to be finalized against a real integration yet, but the auth pattern chosen here will shape how the later ERP integration phase is built.

End of Sprint 7 PRD. This sprint completes all of the input data Cost Core needs — budget (Sprint 5), resource-driven planned cost (Sprint 6), and now actuals. Sprint 8 (EVM Engine) is the final sprint in this phase, combining all three of these with schedule progress from Phase 2 into the platform's core financial performance metrics.

