Product Requirements Document (PRD)
Sprint 20: Reporting Layer — Portfolio Dashboards

1. Objective & Scope
The objective of Sprint 20 is to build the portfolio-level dashboard — rolling up every project dashboard from Sprint 19 across a workspace, so a PMO or multi-project stakeholder can see the whole portfolio's health without opening each project individually.
By the end of this sprint, a PMO Director or Team Lead will be able to:
See the RAG status of every project they have access to, in one view
Sort and filter that view to immediately surface the worst-performing projects
Drill from the portfolio view directly into any individual project's dashboard
See portfolio-level aggregate metrics (total budget, total spend) as true sums of live per-project data
Out of scope for this sprint: any new health calculation logic (this sprint reuses Sprint 19's RAG function and widget resolvers exactly) and cross-organization portfolio views (scoped to a single organization/workspace, per Section 8).
Hard dependency: This sprint requires Sprint 19 (Project Dashboards) to be complete — this sprint is fundamentally an aggregation of Sprint 19's per-project data and logic, not an independent dashboard built from scratch.

2. User Stories
As an Enterprise PMO Director, I want a single view showing the RAG status of every project in my portfolio, so that I can immediately see which ones need attention.
As an Enterprise PMO Director, I want to drill from the portfolio view into a specific project's dashboard, so that I can investigate a flagged project without losing my place in the portfolio view.
As a Team Lead managing several projects, I want to see my own projects' health summarized in one place, so that I don't have to check each one individually every morning.

3. Functional Requirements
3.1 Portfolio Grid/List View
Show every project within the current workspace/organization that the requesting user has access to.
Each project's row/card shows: RAG status, schedule health summary, cost health summary — a compact rollup of Sprint 19's dashboard, reusing its exact widget data and RAG logic, not a re-derived summary.
3.2 Drill-Down Navigation
Clicking any project in the portfolio view navigates directly to that project's Sprint 19 dashboard, preserving the ability to return to the portfolio view afterward.
3.3 Portfolio-Level Aggregate Metrics
Roll up totals across all visible projects: total budget, total actual spend to date, and a count of projects in each RAG state (e.g., "3 Red, 5 Amber, 12 Green").
These aggregates must be genuine sums of live per-project figures (from Cost Core), not an independently maintained portfolio-level number.
3.4 Filtering & Sorting
Filter the portfolio view by RAG status.
Sort by schedule performance (e.g., SPI) and cost performance (e.g., CPI), so the worst-performing projects surface immediately rather than requiring the PMO to scan an unsorted list.
3.5 Access Scoping
The portfolio view must respect existing RBAC exactly — a user sees only the projects within workspaces/organizations they have legitimate access to, with zero exceptions, consistent with every prior phase's RLS pattern.

4. Acceptance Criteria
The portfolio dashboard correctly lists every project the current user has access to, with RAG status and health summaries matching each project's own Sprint 19 dashboard exactly — verified side by side for at least 3 projects.
Clicking a project in the portfolio view correctly navigates to that project's individual Sprint 19 dashboard.
Portfolio-level aggregate metrics correctly match the sum of the underlying per-project figures, verified against manually calculated totals for a test portfolio.
Filtering by RAG status and sorting by cost/schedule performance both function correctly on a portfolio of at least 20 projects.

5. Non-Functional & Security Requirements
Requirement
Detail
Performance
A portfolio dashboard covering 50+ projects should load in under 3 seconds — this requires efficient batch querying across projects, not 50 sequential per-project dashboard loads.
Correctness
Every figure shown in the portfolio view must exactly match its source project's own Sprint 19 dashboard — any drift between the two undermines trust in both views simultaneously.
Data Isolation
The portfolio view must never surface a project the requesting user lacks access to — this is the single most security-sensitive requirement in this sprint, since a portfolio view is inherently a cross-project aggregation.
Consistency
RAG logic and widget-level calculations must be called from the exact same functions built in Sprint 19 — no independent reimplementation, per the Phase 7 PRD's design note.


6. Implementation Task Breakdown: Sprint 20
[Phase 1: Portfolio Query Layer] ──> [Phase 2: Grid/List View] ──> [Phase 3: Aggregate Metrics] ──> [Phase 4: Filtering, Sorting & Drill-Down]
Phase 1: Portfolio Query Layer
Goal: Build the efficient, access-scoped batch query that powers the entire portfolio view.
Task 1.1: Build Batch Project Health Query
Query all projects the current user has access to, calling Sprint 19's RAG function and widget data resolvers for each, optimized to avoid 50 sequential round-trips (e.g., batched queries rather than N+1 per-project calls).
Task 1.2: Enforce Access Scoping
Ensure the query strictly respects existing RLS/RBAC — validated specifically against a test case where a user has access to some but not all projects in a workspace.
Phase 2: Grid/List View
Goal: Render the portfolio-level rollup.
Task 2.1: Build Portfolio Grid/List Component
Render one row/card per project, showing RAG status and health summaries from the Phase 1 query.
Task 2.2: Build Drill-Down Navigation
Wire each project row to navigate to that project's Sprint 19 dashboard.
Phase 3: Aggregate Metrics
Goal: Build the true rollup totals across the visible portfolio.
Task 3.1: Implement Budget/Spend Aggregation
Sum total budget and total actual spend across all visible projects, resolving multi-currency handling consistently with the decision already made in Cost Core.
Task 3.2: Implement RAG Count Summary
Calculate and display the count of projects in each RAG state across the visible portfolio.
Phase 4: Filtering, Sorting & Drill-Down Polish
Goal: Make the portfolio view genuinely useful for triage, not just a static list.
Task 4.1: Build RAG Status Filter
Filter control to show only Red, only Amber, only Green, or all.
Task 4.2: Build Performance Sorting
Sort controls for schedule performance (SPI) and cost performance (CPI), ascending/descending.
Task 4.3: Validate Drill-Down Return Path
Confirm navigating from portfolio → project dashboard → back to portfolio preserves any active filters/sort state, rather than resetting on return.

7. Sprint Delivery Milestones
Milestone 1 — Portfolio Query Layer Live (Target: Day 2) Batch project health query returns correct, access-scoped data efficiently, reusing Sprint 19's functions without reimplementation.
Milestone 2 — Grid View & Drill-Down Working (Target: Day 5) Portfolio grid renders correctly with working drill-down navigation to individual project dashboards.
Milestone 3 — Aggregate Metrics Correct (Target: Day 7) Budget/spend and RAG count aggregates correctly match manually calculated totals across a test portfolio.
Milestone 4 — Filtering, Sorting & Sprint Sign-Off (Target: Day 9) Filtering and sorting both function correctly on a 20+ project portfolio; under-3-second load target met at 50+ projects; all Section 4 acceptance criteria pass — this milestone closes out the entire Reporting Layer phase.

8. Open Questions Carried Into This Sprint
Portfolio scope: does the portfolio view cover a single organization/workspace at a time, or could a user need a blended view across multiple organizations they belong to? Per the Phase 7 PRD's recommendation, this sprint scopes to one organization/workspace at a time, consistent with the platform's existing workspace-switching pattern — confirm this before Task 1.1, since expanding scope later would change the access-scoping query's shape.
Aggregate currency handling: for portfolios containing projects in different currencies, how should budget/spend totals be aggregated — converted to a single reporting currency, or shown only when all projects share a currency (with a warning otherwise)? Must follow whatever conversion-timing decision was already made in Cost Core (Sprint 5/6/7), not an independent call made here.
Large portfolio pagination: at what portfolio size (100+ projects?) does a flat grid/list become unwieldy enough to need pagination or virtualization? Worth a performance test at a larger scale than the 20-project acceptance criterion to see if this needs addressing now or can wait.
"My projects" vs. "all accessible projects" default view: should the portfolio view default to showing every project the user can access, or default to a filtered "projects I'm actively involved in" view with an option to expand? For a PMO Director with access to dozens of projects, an unfiltered default might be overwhelming — worth a UX decision before Task 2.1.

End of Sprint 20 PRD. This sprint completes the Reporting Layer phase (Project Dashboards → Portfolio Dashboards) and, with it, the core "full-vision" feature set originally scoped in the master PRD. Every remaining build-sequence item — Administration & Governance, Integrations — is primarily about who can access the platform and how it connects externally, rather than new core project-management capability.

