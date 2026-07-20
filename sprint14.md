Product Requirements Document (PRD)
Sprint 14: Documentation Engine — Status Report Generator

1. Objective & Scope
The objective of Sprint 14 is to build the Status Report — the most complex document in this phase, and the first to pull from multiple, previously-unrelated phases (Planning Core, Cost Core, Accountability Layer) into one coherent, period-based document, rather than reflecting a single data source the way the Charter, WBS Dictionary, and RACI documents do.
By the end of this sprint, a Project Manager will be able to:
Generate a status report auto-populated with schedule status, cost/EVM status, and top risks
Generate a report for a specific reporting period, not just "right now"
Add narrative free-text alongside the auto-populated data
Retrieve a previously generated report exactly as it was at the time, even if the project has since changed
Out of scope for this sprint: any export format beyond the in-app formatted view (Sprint 15), and scheduled/automatic report generation (explicitly deferred to the Collaboration Layer phase per the parent Phase 5 PRD).
Hard dependency: This sprint requires the Sprint 12 templating engine, Planning Core's schedule data (Sprint 3), Cost Core's EVM engine (Sprint 8), and Accountability Layer's prioritized risk view (Sprint 11). This is the single sprint in the entire platform build sequence with the widest data dependency footprint — nearly everything built so far feeds into this one document.

2. User Stories
As a Project Manager, I want a status report auto-populated with current schedule and cost variance, so that I don't spend my week manually assembling numbers that already live in the system.
As a Project Manager, I want top risks automatically pulled into the status report, so that I don't have to remember to manually cross-reference the risk register every time I write an update.
As a Project Manager, I want to add a narrative summary alongside the auto-populated data, so that the report reads as a coherent update, not just a dump of tables.
As a Project Manager, I want to look back at a report from a previous period and see exactly what it said then, so that I have a real audit trail of how the project's status was communicated over time.

3. Functional Requirements
3.1 Report Composition
Data-bound sections:
Schedule status: overall % complete, critical path health (on track / at risk, based on float), status of upcoming milestones
Cost/EVM status: CPI, SPI, EAC, VAC, budget vs. actual-to-date (from Sprint 8's EVM engine)
Top risks: the highest-scored risks from Sprint 11's prioritized risk view, limited to a sensible top N (e.g., top 5) rather than dumping the entire register
Free-text sections:
Narrative summary
Accomplishments this period
Planned focus for next period
3.2 Period-Based Generation
Support generating a report for a specific reporting period (e.g., "this week," "this month," or a custom date range), pulling schedule and cost/EVM data as of that period's end date, not always "right now."
This requires reading historical EVM snapshots (Sprint 8's evm_snapshots table) rather than only ever the current live calculation, since a report for a past period must reflect that period's numbers, not today's.
3.3 Report History (Snapshot Behavior)
Unlike the Charter/WBS Dictionary/RACI documents (which are always current), a generated Status Report is a frozen historical record the moment it's generated.
Once generated, a report's content — including its data-bound sections — must never change, even as the underlying project data continues to evolve. This is the is_snapshot = true behavior defined in the parent Phase 5 PRD's data model.
Support browsing a list of previously generated reports for a project, ordered by period.

4. Acceptance Criteria
A generated status report correctly reflects schedule and cost/EVM data as of the selected reporting period's end date, matching the underlying Planning Core/Cost Core data for that specific point in time exactly.
Top risks in the report correctly match the live prioritized risk view's top entries by score at generation time.
A previously generated status report remains byte-for-byte unchanged (all data-bound values frozen) even after the underlying project's schedule, cost, and risk data continue to change — verified by generating a report, then substantially altering the project, then re-viewing the original report.
A PM can browse a chronological list of all previously generated reports for a project and open any one of them.

5. Non-Functional & Security Requirements
Requirement
Detail
Performance
Generating a report for a 5,000-activity project must complete in under 5 seconds for a synchronous user action, per the parent Phase 5 PRD's performance target — this assumes EVM/CPM recalculation is already live from Sprints 3/8, not recomputed fresh here.
Correctness
Period-based historical accuracy is the core value of this sprint — a report claiming to reflect "last Friday" that actually shows today's numbers is a serious defect, not a minor bug.
Data Integrity
Snapshot immutability must be enforced at the data layer — no update path, including admin tooling, should be able to alter a generated report's stored data-bound values after creation.
Data Isolation
generated_documents rows for status reports inherit the same project-scoped RLS pattern established since Sprint 1.


6. Implementation Task Breakdown: Sprint 14
[Phase 1: Historical Data Access] ──> [Phase 2: Multi-Source Data Aggregation] ──> [Phase 3: Period-Based Generation] ──> [Phase 4: Snapshot Storage & History Browsing]

Phase 1: Historical Data Access
Goal: Establish the ability to read schedule and cost data as of a past point in time, not just current live state.
[x] Task 1.1: Build Historical EVM Query


Query evm_snapshots (Sprint 8) for the snapshot nearest to (or exactly at) a given period-end date, rather than always the latest live calculation.
[x] Task 1.2: Determine Historical Schedule Status Approach


Since Planning Core doesn't currently store periodic schedule snapshots the way EVM does, decide and implement how period-based schedule status is derived — likely via baseline comparison (Sprint 3's baseline/variance data) rather than a new schedule-snapshot table (see Section 8).
Phase 2: Multi-Source Data Aggregation
Goal: Pull schedule, cost, and risk data into one coherent report structure.
[x] Task 2.1: Build Schedule Status Resolver


Aggregate % complete, critical path health, and milestone status for the report's period.
[x] Task 2.2: Build Cost/EVM Status Resolver


Aggregate CPI, SPI, EAC, VAC, and budget-vs-actual from the Phase 1 historical EVM query.
[x] Task 2.3: Build Top Risks Resolver


Query Sprint 11's prioritized risk view, limited to the top N by score.
Phase 3: Period-Based Generation
Goal: Let a PM choose the reporting period and generate against it correctly.
[x] Task 3.1: Build Period Selection UI


Interface for choosing a reporting period (preset options like "this week"/"this month," plus a custom date range).
[x] Task 3.2: Wire Period Selection to Data Resolvers


Ensure all three Phase 2 resolvers correctly receive and respect the selected period-end date.
[x] Task 3.3: Build Free-Text Entry for Narrative Sections


Entry fields for narrative summary, accomplishments, and next-period focus.
Phase 4: Snapshot Storage & History Browsing
Goal: Make generated reports permanent, immutable records, and let PMs browse them.
[x] Task 4.1: Implement Snapshot Storage on Generation


On generation, write the fully resolved data-bound values (not live references) into generated_documents with is_snapshot = true.
[x] Task 4.2: Enforce Snapshot Immutability


Ensure no code path can update a report's stored values after creation — only new report generations create new rows.
[x] Task 4.3: Build Report History List View


Chronological list of all generated reports for a project, each opening to its frozen, as-generated content.

7. Sprint Delivery Milestones
Milestone 1 — Historical Data Access Working (Target: Day 3) Historical EVM queries correctly return period-accurate data; the schedule status historical approach (Task 1.2) is decided and implemented.
Milestone 2 — Multi-Source Aggregation Correct (Target: Day 6) All three resolvers (schedule, cost/EVM, risk) correctly aggregate their respective data for a given period.
Milestone 3 — Period-Based Generation Working (Target: Day 9) A PM can select a reporting period and generate a report with data correctly reflecting that period, not the current moment.
Milestone 4 — Snapshot Immutability, History & Sprint Sign-Off (Target: Day 12) Generated reports are verified immutable even after substantial underlying project changes; report history browsing works correctly; all Section 4 acceptance criteria pass — this is the most rigorously tested sprint in the phase given the data-integrity stakes.

8. Open Questions Carried Into This Sprint
Historical schedule status source (Task 1.2): since there's no periodic schedule-snapshot table equivalent to evm_snapshots, should this sprint build one, or derive historical schedule status from the existing baseline/variance data in Sprint 3? Building a new snapshot table adds scope but gives more accurate historical fidelity; deriving from baseline comparison is faster to ship but may be less precise for periods between baseline saves. Recommend deriving from baseline comparison for launch, with a dedicated schedule-snapshot table flagged as a future enhancement if historical accuracy proves insufficient.
Period boundary definition: does "this week's" report use calendar week, the organization's defined work week (from Sprint 3's calendar settings), or a PM-configurable reporting cadence? Recommend defaulting to calendar week/month for simplicity, with custom date range always available as an escape hatch.
Report generation frequency limits: should a PM be able to generate multiple reports for the same period (creating several historical snapshots that all claim to represent "last week"), or should generation be idempotent per period? Allowing multiple is simpler to build; restricting to one avoids a confusing history full of near-duplicate reports.
Top-N risk count: is 5 the right default for the top-risks section, or should this be configurable per report/project? Recommend a fixed default of 5 for launch simplicity, configurable later if requested.

End of Sprint 14 PRD. This sprint delivers the most operationally valuable document in the entire phase — a status report a PM would otherwise spend hours assembling by hand every week — and is the clearest direct payoff of every prior phase's investment in live, connected data. Sprint 15 (Multi-Format Export & Document Management) generalizes export and history capabilities across this and every other document type built in the phase.

