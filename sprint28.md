Product Requirements Document (PRD)
Sprint 28: Integrations — ERP/Accounting Export Integration

1. Objective & Scope
The objective of Sprint 28 is to finally wire a real ERP/accounting system connector into the integration-ready hook explicitly deferred from Cost Core's Sprint 7 — closing that phase's scope gap using the general-purpose API/webhook infrastructure just built in Sprint 27, rather than a separate, bespoke ingestion pipeline.
By the end of this sprint, an organization admin will be able to:
Configure and enable a connector to at least one real accounting/ERP system
Map that system's cost categories/accounts to the platform's WBS structure
Have actual costs flow in automatically, correctly attributed, with failures clearly surfaced
Out of scope for this sprint: connectors for any system beyond the one selected for this sprint (per Section 8, this should be driven by actual customer demand) — additional connectors are a future iteration  using this same pattern.
Hard dependency: This sprint requires Sprint 27 (Public API & Webhooks) to be complete, since this connector is explicitly built as an application of that infrastructure, not a separate pipeline. It also requires Cost Core's Sprint 7 actual_costs table and its source = 'api' tagging, which was designed specifically for this sprint to use.

2. User Stories
As a Project Manager, I want actual costs from our accounting system to flow into the platform automatically, so that I don't have to manually re-enter or CSV-import them every reporting period.
As a Finance stakeholder, I want confidence that actual cost data reflects our accounting system's real records, so that EVM figures in the platform are trustworthy for financial reporting purposes.
As an organization admin, I want to see clearly when a sync fails, so that I know to investigate rather than assuming data is current when it might be stale or incomplete.

3. Functional Requirements
3.1 Connector Implementation
Build a real, working connector for one commonly requested accounting/ERP system, selected per the process described in Section 8.
The connector must use Sprint 27's public API as its underlying data-ingestion mechanism — this sprint should not introduce a second, parallel data pipeline into actual_costs that bypasses the API layer.
3.2 Actuals Ingestion
The connector pushes actual cost records from the external system into actual_costs (Cost Core's Sprint 7), using source = 'api' as already designed for exactly this purpose.
Each ingested record must resolve to a valid wbs_element_id, consistent with Sprint 7's non-negotiable attribution requirement — records that can't be mapped must be flagged, not silently dropped or attributed incorrectly.
3.3 Sync Configuration & Account Mapping
An organization admin can configure and enable/disable the connector.
The admin can map the external system's cost categories/accounts to the platform's WBS work packages, so incoming actuals land in the right place.
Support re-mapping over time as the WBS or the external system's chart of accounts evolves.
3.4 Error Handling & Visibility
A failed sync (connection failure, authentication failure, unmapped cost category) must be clearly surfaced to the admin with an actionable message — never silently dropped, given how consequential actual cost data is to EVM calculations.
Partial sync failures (some records succeed, others fail) must report exactly which records failed and why, not just an aggregate failure count.

4. Acceptance Criteria
Actual cost records pushed from the connected ERP/accounting system correctly appear in actual_costs, correctly attributed to WBS elements per the admin's configured mapping.
A sync failure (e.g., a mapping error, an unreachable external system) is clearly surfaced to the admin with an actionable error, not silently dropped.
This connector uses Sprint 27's public API infrastructure as its underlying mechanism — verified by confirming no separate, parallel ingestion pathway was built outside that API.
A partial sync failure correctly reports which specific records failed and why, distinct from a full sync failure.

5. Non-Functional & Security Requirements
Requirement
Detail
Correctness
Actual cost data feeding EVM calculations must be exactly correct — an incorrectly mapped or duplicated actual cost record directly corrupts CPI/EAC/VAC figures downstream, which is a serious defect, not a minor data quality issue.
Reliability
Sync failures must never be silent — this is the single most important guarantee in this sprint, given how consequential actual cost data is.
Consistency
This connector must be built as a consumer of Sprint 27's public API, not a separate integration pipeline — verified explicitly in code review, not just assumed.
Data Integrity
Duplicate ingestion (e.g., the same external record synced twice due to a retry) must be prevented via idempotency (e.g., an external record ID uniqueness check), not left to accumulate as duplicate actual costs.


6. Implementation Task Breakdown: Sprint 28
[Phase 1: Connector Configuration Schema] ──> [Phase 2: Connector Authentication & Data Fetch] ──> [Phase 3: Account Mapping & Ingestion] ──> [Phase 4: Error Handling & Sync Visibility]

Phase 1: Connector Configuration Schema
Goal: Provision the configuration table for the connector, kept generic enough to support future connectors of the same shape.
[ ] Task 1.1: Design Connector Configuration Schema


Create a SQL migration for public.erp_connector_configurations (id, organization_id, connector_type, account_mapping [JSON], enabled).
[ ] Task 1.2: Configure Row Level Security


Restrict configuration access to organization Admin role.
Phase 2: Connector Authentication & Data Fetch
Goal: Establish the connection to the external accounting/ERP system.
[ ] Task 2.1: Implement Connector Authentication


Build the authentication flow for the selected system (OAuth, API key, or whatever that system's integration model requires).
[ ] Task 2.2: Implement Data Fetch


Build the logic to pull actual cost/transaction records from the external system on a scheduled or triggered basis.
Phase 3: Account Mapping & Ingestion
Goal: Translate external cost data into correctly-attributed platform records.
[ ] Task 3.1: Build Account Mapping UI


Interface for an admin to map the external system's cost categories/accounts to platform WBS work packages.
[ ] Task 3.2: Implement Ingestion via Sprint 27's API


Push mapped records into actual_costs through Sprint 27's public write API (not a direct database write bypassing that layer), with source = 'api' tagging.
[ ] Task 3.3: Implement Idempotency


Ensure a uniqueness check on external record ID prevents duplicate ingestion on retry or re-sync.
Phase 4: Error Handling & Sync Visibility
Goal: Make failures impossible to miss.
[ ] Task 4.1: Build Sync Status Dashboard


Admin-facing view showing last sync time, success/failure status, and specific per-record failure details for partial failures.
[ ] Task 4.2: Implement Failure Notifications


Notify the admin (reusing Sprint 17's notification infrastructure) when a sync fails, rather than requiring them to proactively check a status dashboard.

7. Sprint Delivery Milestones
Milestone 1 — Connector Configuration Live (Target: Day 3) erp_connector_configurations table deployed with RLS confirmed; admin can configure a connector for the selected system.
Milestone 2 — Authentication & Data Fetch Working (Target: Day 6) Connector successfully authenticates and fetches transaction data from the external system.
Milestone 3 — Mapping & Ingestion Working (Target: Day 9) Account mapping UI works correctly; ingested records correctly appear in actual_costs via Sprint 27's API, with idempotency confirmed against duplicate sync attempts.
Milestone 4 — Error Handling & Sprint Sign-Off (Target: Day 12) Sync failures are clearly surfaced with per-record detail on partial failures; admin notifications fire correctly; all Section 4 acceptance criteria pass — this milestone closes out the entire Integrations phase and the master PRD's full build sequence.

8. Open Questions Carried Into This Sprint
Which system to build first: as flagged in the Phase 9 PRD, this should be driven by actual early enterprise customer demand (e.g., QuickBooks, SAP, NetSuite, Xero) rather than an arbitrary engineering choice — this needs to be confirmed with sales/customer-success input before Task 1.1 locks in a specific system's authentication/data model.
Sync frequency: should this run on a scheduled interval (e.g., nightly) or be triggerable on-demand by the admin (or both)? Recommend supporting both — a scheduled default plus a manual "sync now" action for when a PM needs current data ahead of a report.
Historical backfill: when a connector is first enabled, should it backfill historical actual cost data, or only ingest going forward from the enablement date? Backfill is more complete but riskier (potential for a large influx of records needing mapping validation) — recommend forward-only ingestion for initial launch, with backfill as an explicit, admin-triggered action if needed.
Mapping validation: should the system block enabling the connector until every relevant external cost category has been mapped, or allow partial mapping with unmapped categories simply flagged as failures on ingestion? Recommend allowing partial mapping (per Section 3.4's error-visibility requirement) rather than blocking activation entirely, since requiring a complete mapping upfront could meaningfully delay adoption.

End of Sprint 28 PRD. This sprint completes the Integrations phase and, with it, every build-sequence item originally scoped in the master PRD's Section 12 — Foundation through Integrations. The platform's full-vision feature set, as specified from the very first PRD in this sequence, is now completely specced across 28 sprints and 9 phases.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

