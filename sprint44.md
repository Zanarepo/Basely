# Product Requirements Document (PRD)
# Sprint 44: Release Plan Module — Release & Iteration Data Model

---

## 1. Objective & Scope

The objective of Sprint 44 is to build the foundational `Iteration` and `Release` entities — the single architectural decision this entire phase depends on getting right. One generic `Iteration` table must serve both "Sprint" (Agile) and "Phase" (Waterfall) without ever forking into two schemas.

By the end of this sprint, a Project Manager will be able to:
- Define Iterations for their project — labeled Sprint or Phase based on the project's methodology
- Tag WBS elements/activities to a specific Iteration
- Group Iterations into a Release, with scope automatically derived from tagged work
- Define and track exit criteria per Release

**Out of scope for this sprint:** readiness checklists, approval gating, and deployment/rollback plans (Sprint 45); metrics and dashboard integration (Sprint 46); generated artifacts (Sprint 47).

> **Hard dependency:** This sprint requires Planning Core's Sprint 2 (WBS) and Sprint 3 (Activities), since Iteration-tagging attaches to both. It reads `project.methodology` from Foundation's Sprint 1 but does not modify that field.

### 1.1 Market Context: Why a Single Entity, Not Two

Hybrid delivery ("Wagile," "Water-Scrum-Fall") is now the dominant real-world pattern, not an edge case — industry data puts hybrid approaches at roughly 60–70% of successful large-scale projects, and as high as 89% adoption among high-performing organizations. Tooling has not kept pace with that shift. Most platforms that market themselves as "hybrid-capable" (Businessmap, QPunch, Wrike-style suites) solve this at the *view* layer: Agile teams get a Kanban board, Waterfall teams get a Gantt chart, and a shared dashboard reconciles the two after the fact. Under the hood, a Sprint and a Phase remain two different objects being stitched together by reporting — coexistence, not unification.

This sprint's bet is different and more defensible: `Iteration` is one table with a UI-layer label, so a Release's scope, exit criteria, and (in later sprints) metrics are computed identically regardless of which methodology produced the underlying work. This is what makes a project's `methodology` field mean something structurally, rather than just cosmetically — and it's the reason this data model, not just the UI on top of it, is the actual product differentiator worth protecting in code review.

---

## 2. User Stories

- **As a Project Manager running Agile**, I want to define sprints for my project, so that I can group work into short, regular iterations.
- **As a Project Manager running Waterfall**, I want to define phases for my project, so that I can group work into major sequential stages.
- **As a Project Manager on either methodology**, I want to group my iterations into named releases with defined scope, so that I can plan what ships when.
- **As a Project Manager**, I want a release's scope to build itself from work I've already tagged, so that I'm not maintaining a second, disconnected list of what's included.

---

## 3. Functional Requirements

### 3.1 Iteration Entity
- Fields: `name`, `sequence_number`, `start_date`, `end_date`, `project_id`.
- One schema, two UI labels: rendered as "Sprint" for Agile projects, "Phase" for Waterfall projects, per `project.methodology`. For Hybrid projects, label is set per-Iteration (per Section 8's recommendation).
- No functional behavior differs between the two labels — this is purely presentational.

### 3.2 WBS/Activity Tagging
- Any WBS element or schedule activity can be tagged to zero or one Iteration via a nullable `iteration_id` foreign key.
- Tagging is a lightweight assignment action, available from both the WBS tree (Sprint 2's UI) and the Gantt view (Sprint 4's UI), not a separate, disconnected screen.

### 3.3 Release Entity
- Fields: `name`, `objective`, `sequence_number`, `status` (planned/in_progress/released/rolled_back/canceled — per Section 8's addition), `project_id`.
- Linked to one or more Iterations via a many-to-many join.

### 3.4 Release Scope Derivation
- A Release's scope is the union of all WBS elements/activities tagged to its linked Iterations — computed, not manually maintained.
- Manual scope addition/removal is supported for edge cases, visually distinguished (e.g., a badge) from auto-derived items so a PM always knows which is which.

### 3.5 Exit Criteria
- A Release has a list of exit criteria: `criterion_text`, `is_met` (boolean).
- Completion percentage is calculated and displayed prominently on the Release detail view.

---

## 4. Acceptance Criteria

- An Agile project can define 5 sprints (Iterations), tag WBS work packages to them, and a Release spanning 2 of those sprints correctly derives its scope as the union of that tagged work.
- A Waterfall project can define 3 phases (the identical `Iteration` entity, labeled "Phase") and achieve the same automatic derivation for a Release spanning those phases.
- Manually adding a scope item not tagged to any linked Iteration works correctly and is visually distinguished from auto-derived scope.
- Exit criteria can be added and checked off, with the Release's completion percentage updating immediately and accurately.
- **A project's methodology is changed from Agile to Hybrid mid-flight, and all existing Iterations and their tagged WBS/activity data are retained without migration, re-entry, or data loss** — the test that confirms the schema never quietly forked into an Agile table and a Waterfall table, which is the specific failure mode most "hybrid-capable" tools on the market fall into today.

---

## 5. Non-Functional & Security Requirements

| Requirement | Detail |
|---|---|
| **Data Isolation** | `iterations` and `releases` inherit the standard project-scoped RLS pattern established since Sprint 1. |
| **Schema Consistency** | The Agile/Waterfall distinction must never become two different tables — this is a UI-layer label only, verified in code review as a hard requirement, not a suggestion. |
| **Extensibility** | `Release.status` is an open enum, consistent with `Risk.status` and `ApprovalRequest.status` elsewhere in the platform. |

---

## 6. Implementation Task Breakdown: Sprint 44

```
[Phase 1: Iteration Schema] ──> [Phase 2: Release Schema] ──> [Phase 3: Scope Derivation] ──> [Phase 4: Exit Criteria]
```

### Phase 1: Iteration Schema
- [ ] **Task 1.1:** Design `public.iterations` (`id`, `project_id`, `name`, `sequence_number`, `start_date`, `end_date`).
- [ ] **Task 1.2:** Add nullable `iteration_id` to `wbs_elements` and `activities`.
- [ ] **Task 1.3:** Build the UI labeling logic (Sprint vs. Phase) driven by `project.methodology`, including the per-Iteration override for Hybrid projects.

### Phase 2: Release Schema
- [ ] **Task 2.1:** Design `public.releases` (`id`, `project_id`, `name`, `objective`, `sequence_number`, `status`).
- [ ] **Task 2.2:** Design `public.release_iterations` (`release_id`, `iteration_id`) many-to-many join.

### Phase 3: Scope Derivation
- [ ] **Task 3.1:** Build the scope-derivation query (union of tagged WBS elements/activities across a Release's linked Iterations).
- [ ] **Task 3.2:** Build manual scope addition/removal with clear visual distinction from auto-derived items.

### Phase 4: Exit Criteria
- [ ] **Task 4.1:** Design `public.release_exit_criteria` (`id`, `release_id`, `criterion_text`, `is_met`).
- [ ] **Task 4.2:** Build the exit-criteria checklist UI with a completion percentage indicator.

---

## 7. Sprint Delivery Milestones

**Milestone 1 — Iteration Schema Live** *(Target: Day 3)*
`iterations` table deployed; WBS/activity tagging functional; Sprint/Phase labeling correctly driven by project methodology.

**Milestone 2 — Release Schema Live** *(Target: Day 5)*
`releases` table deployed with correct many-to-many linkage to Iterations.

**Milestone 3 — Scope Derivation Working** *(Target: Day 7)*
Release scope correctly auto-derives from tagged work; manual overrides work and are visually distinct.

**Milestone 4 — Exit Criteria & Sprint Sign-Off** *(Target: Day 8)*
Exit criteria checklist and completion percentage function correctly; all Section 4 acceptance criteria pass, including both the Agile and Waterfall test scenarios and the mid-flight methodology-change test.

---

## 8. Open Questions Carried Into This Sprint

- **Iteration overlap:** allow overlapping date ranges between Iterations on the same project (a valid Waterfall case — e.g., testing beginning before development fully ends), rather than blocking it.
- **Hybrid methodology labeling:** support per-Iteration Sprint/Phase labeling for Hybrid-tagged projects, rather than a single platform-wide default.
- **Release cancellation:** include a `canceled` status alongside `rolled_back`, since a release that was planned but never shipped is a meaningfully different outcome than one that shipped and was reverted.



Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.
---

*End of Sprint 44 PRD. The single most important thing to protect from this sprint forward: `Iteration` stays one table with a UI label, never two schemas. Every later sprint in this phase assumes that holds — and it's the specific thing most competing "hybrid" tools get wrong at the data layer, even when their UI looks like it supports both methodologies.*