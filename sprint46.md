# Product Requirements Document (PRD)
# Sprint 46: Release Plan Module — Release Metrics & Dashboard Integration

---

## 1. Objective & Scope

The objective of Sprint 46 is to surface release-level metrics and burn-down/up charts directly on the platform's existing dashboard architecture — reusing calculation logic already built, never introducing an independent number.

By the end of this sprint, a Project Manager will be able to:
- See release-level exit-criteria and readiness-checklist completion at a glance
- View a burn-down/up chart scoped to a specific release's Iterations
- See a release-level RAG (Red/Amber/Green) status using the platform's existing threshold logic

**Out of scope for this sprint:** generated release artifacts (Sprint 47).

> **Hard dependency:** This sprint requires Sprint 44/45's Release data, Reporting Layer's Sprint 19 (RAG threshold function, dashboard widget architecture), Sprint 42 (burn-down/up chart infrastructure), and Cost Core's Sprint 8 (EVM engine, for the optional release-scoped EVM extension).

---

## 2. User Stories

- **As a Project Manager**, I want to see release-level metrics (exit-criteria completion, readiness completion, defect counts), so that I can evaluate release health at a glance.
- **As a Project Manager**, I want a burn-down view scoped to a specific release's Iterations, so that I can see progress toward that release specifically.
- **As a Project Manager**, I want a release-level RAG status, so that I can quickly assess whether a specific release is at risk.

---

## 3. Functional Requirements

### 3.1 Release Metrics Widget
- Added to the existing Project Dashboard (Sprint 19): a release-scoped view showing exit-criteria completion %, readiness-checklist completion %, and defect/issue counts linked via existing Risk/Issue data (Sprint 11).

### 3.2 Release-Scoped Burn-down/up
- Reuses Sprint 42's burn-down/burn-up chart infrastructure exactly, adding an optional Release/Iteration scope filter — the same underlying widget and calculation, not a new chart type.

### 3.3 Release RAG Status
- Derived using the identical centrally-defined threshold function from Sprint 19, applied to the release's scope subset rather than the whole project.

### 3.4 Optional Release-Scoped EVM
- A release-scoped CPI/SPI view, filtering Sprint 8's EVM engine output to only WBS elements tagged to the release's Iterations — an extension of existing calculation, not new logic.

---

## 4. Acceptance Criteria

- A release-scoped metrics widget correctly shows exit-criteria and readiness-checklist completion percentages, matching underlying checklist data exactly.
- A release-scoped burn-down/up chart correctly reflects only work tagged to that release's Iterations, matching the same underlying data/calculation as the project-wide chart.
- Release RAG status uses the identical threshold function as Sprint 19/20's project/portfolio RAG, verified with zero drift.
- A release-scoped EVM view (if built) correctly filters CPI/SPI to only the release's tagged WBS elements, matching a manually calculated subset exactly.

---

## 5. Non-Functional & Security Requirements

| Requirement | Detail |
|---|---|
| **No Duplicate Calculation** | Every metric in this sprint is a filtered view of existing data/logic — zero new calculation logic is introduced. |
| **Performance** | Release-scoped views must perform comparably to their project-wide equivalents. |
| **Correctness** | A release-scoped figure must always be traceable back to the exact same source data as its project-wide equivalent. |

---

## 6. Implementation Task Breakdown: Sprint 46

```
[Phase 1: Release Metrics Widget] ──> [Phase 2: Release-Scoped Burn-down/up] ──> [Phase 3: Release RAG Status] ──> [Phase 4: Release-Scoped EVM (Optional)]
```

### Phase 1: Release Metrics Widget
- [ ] **Task 1.1:** Build the release metrics widget reading from `release_exit_criteria` and `release_readiness_items`.
- [ ] **Task 1.2:** Wire defect/issue counts linked to the release's scope via existing Risk/Issue data.

### Phase 2: Release-Scoped Burn-down/up
- [ ] **Task 2.1:** Extend Sprint 42's burn-down/up widget to accept an optional Release/Iteration scope filter parameter.

### Phase 3: Release RAG Status
- [ ] **Task 3.1:** Wire Sprint 19's RAG threshold function to accept a release-scoped data subset as input.

### Phase 4: Release-Scoped EVM (Optional)
- [ ] **Task 4.1:** Build the filtered CPI/SPI view for release-tagged WBS elements, reusing Sprint 8's EVM engine calculation directly.

---

## 7. Sprint Delivery Milestones

**Milestone 1 — Metrics Widget Live** *(Target: Day 2)*
Release metrics widget correctly displays exit-criteria/readiness/defect data.

**Milestone 2 — Burn-down/up Scoping Working** *(Target: Day 4)*
Release-scoped chart correctly filters to only tagged work, matching underlying data exactly.

**Milestone 3 — RAG Status Working** *(Target: Day 6)*
Release RAG status correctly matches the centrally-defined threshold function with zero drift.

**Milestone 4 — Optional EVM Extension & Sprint Sign-Off** *(Target: Day 7)*
Release-scoped EVM view (if built) correctly filters CPI/SPI; all Section 4 acceptance criteria pass.

---

## 8. Open Questions Carried Into This Sprint

- **Release-level EVM priority:** confirm whether Section 3.4/Task 4.1 is in-scope or deferred — recommend including it since the underlying engine already supports the necessary filtering with minimal additional work.
- **Widget placement:** should the release metrics widget appear on the existing Project Dashboard, or as a separate "Release" tab/view? Recommend a dedicated Release detail view with a summary card surfaced on the main dashboard, rather than crowding the main dashboard with full release detail.

---

*End of Sprint 46 PRD. Every acceptance criterion in this sprint includes an explicit "matches the source data exactly" check — deliberate, since the entire value of this sprint is trustworthy reuse, not a new reporting surface that could quietly drift from the numbers everywhere else in the platform.*