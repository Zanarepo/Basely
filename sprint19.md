Product Requirements Document (PRD)
Sprint 19: Reporting Layer — Project Dashboards

1. Objective & Scope
The objective of Sprint 19 is to build the single-project dashboard — the first screen a PM should land on, surfacing schedule health, cost health, RAG status, upcoming milestones, and top risks without requiring navigation into individual modules.
By the end of this sprint, a Project Manager will be able to:
Open a project and immediately see whether it's on track, on both schedule and cost
See an overall RAG (Red/Amber/Green) status derived from defined thresholds
See upcoming milestones and top risks without leaving the dashboard
Out of scope for this sprint: the portfolio-level rollup (Sprint 20), custom widget configuration, and historical trend charts (both explicitly deferred per the parent Phase 7 PRD).
Hard dependency: This sprint requires every prior phase to be complete — Planning Core (schedule/float/milestones), Cost Core (live EVM), and Accountability Layer (prioritized risk view) are all read directly by this sprint's widgets. This is a pure presentation layer; no new source-of-truth data is introduced.

2. User Stories
As a Project Manager, I want a dashboard summarizing my project's schedule and cost health, so that I know at a glance whether things are on track without clicking through five different screens.
As a Project Manager, I want to see upcoming milestones directly on my dashboard, so that I don't have to open the Gantt chart just to check what's coming up next.
As an Enterprise PMO Director, I want a clear RAG status on every project, so that I can quickly triage which projects need my attention.

3. Functional Requirements
3.1 Schedule Health Widget
Overall % complete (rolled up from activity-level percent_complete, Sprint 3).
Critical path status: on track / at risk, derived from whether critical-path activities have slipped against baseline (Sprint 3's baseline/variance data).
Milestone count: hit vs. missed vs. upcoming.
3.2 Cost Health Widget
Current CPI, SPI, EAC, and budget-vs-actual-to-date.
Read directly from Sprint 8's live EVM engine (evm_snapshots/live calculation) — this widget must never maintain its own cached or independently-calculated copy of these figures.
3.3 RAG Status Indicator
A single overall Red/Amber/Green status, derived from a centrally-defined threshold function combining schedule and cost health signals (e.g., CPI/SPI bands, critical path slippage).
This threshold logic must be implemented as a single, reusable function — not duplicated inline in this widget — since Sprint 20's portfolio rollup will need to call the exact same logic.
3.4 Upcoming Milestones Widget
The next N milestones (Planning Core, activity type = milestone), with dates and status.
3.5 Risk Summary Widget
Top risks by score, reusing the same prioritized risk view resolver already built for Accountability Layer's Sprint 11 and Documentation Engine's Sprint 14 Status Report — not a third independent implementation of "top risks by score."
3.6 Live Data Guarantee
Every widget must reflect current live data on load — no separately cached dashboard summary that could diverge from the detail views (Gantt, budget, risk register) a PM would navigate to next.

4. Acceptance Criteria
Opening a project's dashboard correctly displays schedule health, cost health, RAG status, upcoming milestones, and top risks, all matching the live data shown in their respective detail views exactly.
Changing an underlying value (e.g., logging an actual cost that shifts CPI, per Cost Core's Sprint 7) is reflected on the dashboard without requiring anything beyond a normal page load/refresh.
RAG status correctly reflects the defined threshold logic, verified against test projects deliberately constructed to trigger Red, Amber, and Green states.

5. Non-Functional & Security Requirements
Requirement
Detail
Performance
Dashboard must load in under 2 seconds, even for a 5,000-activity project — this assumes CPM/EVM recalculation is already live from Sprints 3/8, not recomputed fresh on dashboard load.
Correctness
Dashboard figures must always exactly match their corresponding detail-view figures; any discrepancy is a critical defect, not a minor inconsistency.
Data Isolation
Dashboard queries inherit the same project-scoped RLS pattern established across every prior phase.
Reusability
The RAG threshold function and the top-risks resolver must each be implemented once and called from this sprint, not reimplemented, given both already exist or are about to be centrally defined (see Task 1.2).


6. Implementation Task Breakdown: Sprint 19
[Phase 1: RAG Threshold Logic] ──> [Phase 2: Schedule & Cost Widgets] ──> [Phase 3: Milestones & Risk Widgets] ──> [Phase 4: Dashboard Assembly & Performance]
Phase 1: RAG Threshold Logic
Goal: Define the single, centrally-reusable RAG determination function before any widget depends on it.
Task 1.1: Define RAG Threshold Function
Implement a single function taking schedule and cost health signals (CPI, SPI, critical path slippage) and returning Red/Amber/Green, using the default thresholds pending stakeholder confirmation (see Section 8).
Task 1.2: Centralize for Reuse
Ensure this function is callable identically by both this sprint's dashboard and Sprint 20's portfolio rollup — not duplicated logic in two places.
Phase 2: Schedule & Cost Widgets
Goal: Build the two core health widgets, reading directly from Planning Core and Cost Core.
Task 2.1: Build Schedule Health Widget
Query % complete, critical path status, and milestone hit/missed counts from Planning Core data.
Task 2.2: Build Cost Health Widget
Query CPI, SPI, EAC, and budget-vs-actual directly from Sprint 8's live EVM engine.
Task 2.3: Wire RAG Status Display
Call the Phase 1 threshold function with both widgets' data and render the resulting status prominently.
Phase 3: Milestones & Risk Widgets
Goal: Round out the dashboard with forward-looking and risk-awareness widgets.
Task 3.1: Build Upcoming Milestones Widget
Query upcoming milestone activities, sorted by date.
Task 3.2: Build Risk Summary Widget
Reuse the existing prioritized risk view resolver (Sprint 11/14) to display top risks by score.
Phase 4: Dashboard Assembly & Performance
Goal: Bring all widgets together into a single, fast-loading dashboard view.
Task 4.1: Build Dashboard Layout
Assemble all five widgets into the project dashboard view, as the default landing screen for an opened project.
Task 4.2: Performance Testing
Validate the under-2-second load target on a 5,000-activity project; optimize query patterns (e.g., parallel widget data fetching) if needed.

7. Sprint Delivery Milestones
Milestone 1 — RAG Logic Defined (Target: Day 2) Centralized RAG threshold function implemented and unit-tested against known Red/Amber/Green scenarios.
Milestone 2 — Schedule & Cost Widgets Working (Target: Day 5) Both widgets correctly display live data matching their respective detail views exactly.
Milestone 3 — Milestones & Risk Widgets Working (Target: Day 7) Both widgets correctly display live data, reusing existing resolvers rather than new implementations.
Milestone 4 — Full Dashboard & Sprint Sign-Off (Target: Day 9) All widgets assembled into a single dashboard view; under-2-second load target met on a 5,000-activity project; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
RAG threshold values: what specific CPI/SPI/float thresholds define Red/Amber/Green? This is a product decision requiring stakeholder input, not something engineering should decide unilaterally — must be resolved before Task 1.1 is finalized (a reasonable starting default is proposed in the Phase 7 PRD, but should be confirmed, not assumed).
Per-project widget customization: should a PM be able to reorder or hide widgets on their own dashboard, even without a full custom report builder? A small amount of customization might be cheap to include now versus waiting for the deferred report-builder phase — worth a quick scope call.
Milestone count ("upcoming N"): what's a sensible default number of upcoming milestones to show (5? 10?), and should it be configurable? Recommend a fixed default of 5 for launch simplicity.

End of Sprint 19 PRD. This sprint's RAG threshold function and widget-level data resolvers are exactly what Sprint 20 (Portfolio Dashboards) will reuse at scale across every project in a workspace — building them cleanly and centrally here is what makes Sprint 20 straightforward rather than a second independent implementation.

Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

