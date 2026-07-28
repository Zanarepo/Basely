# Product Requirements Document (PRD)
# Sprint 45: Release Plan Module — Readiness Checklist, Approval Gate & Deployment/Rollback Plans

---

## 1. Objective & Scope

The objective of Sprint 45 is to build the release readiness checklist, the release approval gate, and structured deployment/rollback plan capture — extending existing platform infrastructure rather than inventing new gating mechanisms.

By the end of this sprint, a Project Manager will be able to:
- Complete a category-grouped readiness checklist before shipping a release
- Have release promotion correctly gated through existing approval infrastructure, tier-appropriately
- Document a structured deployment plan and rollback plan per release

**Out of scope for this sprint:** release metrics/dashboards (Sprint 46) and generated release artifacts (Sprint 47) — though this sprint's checklist and plan data are exactly what those later sprints will read from.

> **Hard dependency:** This sprint requires Sprint 44's `Release` entity, Administration & Governance's Sprint 22 (`ApprovalRequest`/`ApprovalPolicy`), Back Office's Sprint 29 (tier-check function), and Sprint 41's Change Request Log pattern for non-Enterprise tiers.

---

## 2. User Stories

- **As a Project Manager**, I want a standard readiness checklist before I mark a release as shipped, so that I don't skip steps under deadline pressure.
- **As an Approver**, I want release sign-off to go through the same approval mechanism as other gated changes, so that I have one place to review pending decisions, not several.
- **As a Project Manager**, I want to document my deployment and rollback plan for each release, so that the team has a clear reference if something goes wrong.

---

## 3. Functional Requirements

### 3.1 Readiness Checklist
- Category-grouped checklist items (default categories: Product, Engineering, QA, DevOps, Documentation), each checkable with attribution (who checked it, when).
- Organization-level customization of default categories/items.

### 3.2 Release Approval Gate
- Add `release_promotion` as a new `ApprovalPolicy.action_type` value.
- Tier-aware routing (via Sprint 29's `checkFeatureAccess`):
  - **Enterprise with approval workflows enabled:** a release moving to `in_progress`/`released` creates a real `ApprovalRequest`, following Sprint 22's exact flow.
  - **All other cases:** uses Sprint 41's standalone Change Request Log pattern — a PM records the decision themselves, no formal gating.
- A release cannot transition to `released` status while required exit criteria (Sprint 44) remain unmet, regardless of which approval path applies.

### 3.3 Deployment Plan
- Structured, checkable steps grouped into Before / During / After, per release — not free text.
- Each step: description, checked state, timestamp, acting user.

### 3.4 Rollback Plan
- Same structured checklist pattern as the Deployment Plan, covering the standard rollback sequence (stop deployment, restore prior version, roll back data changes, validate, root cause, reschedule).

---

## 4. Acceptance Criteria

- A readiness checklist can be created and checked off per release, grouped by category, with completion visible at a glance.
- An Enterprise organization with approval workflows enabled correctly routes release promotion through `ApprovalRequest`; a non-Enterprise organization correctly uses the standalone Change Request Log — verified against both cases directly.
- A release cannot be marked `released` while exit criteria remain unmet, verified by an explicit attempt.
- Deployment and Rollback plans can be defined and tracked as structured, checkable steps.

---

## 5. Non-Functional & Security Requirements

| Requirement | Detail |
|---|---|
| **No Duplication** | The release approval gate reuses Sprint 22's `ApprovalRequest` and Sprint 41's Change Request Log exactly — no third gating mechanism is introduced. |
| **Data Integrity** | The exit-criteria-before-release-status-change rule is enforced at the API layer. |
| **Auditability** | Every checklist completion and approval decision is logged consistently with the platform's existing activity-log pattern. |

---

## 6. Implementation Task Breakdown: Sprint 45

```
[Phase 1: Readiness Checklist] ──> [Phase 2: Approval Gate Integration] ──> [Phase 3: Deployment Plan] ──> [Phase 4: Rollback Plan]
```

### Phase 1: Readiness Checklist
- [ ] **Task 1.1:** Design `public.release_readiness_items` (`id`, `release_id`, `category`, `item_text`, `is_checked`, `checked_by_user_id`, `checked_at`).
- [ ] **Task 1.2:** Build organization-level default-checklist customization.

### Phase 2: Approval Gate Integration
- [ ] **Task 2.1:** Add `release_promotion` to `ApprovalPolicy.action_type`'s enum.
- [ ] **Task 2.2:** Wire the tier-check routing between `ApprovalRequest` (Enterprise-with-workflows) and the standalone Change Request Log (all other cases).
- [ ] **Task 2.3:** Enforce the exit-criteria-complete precondition before any release-status transition to `released`.

### Phase 3: Deployment Plan
- [ ] **Task 3.1:** Design `public.release_deployment_plans` (`release_id`, `steps` [structured, before/during/after]).
- [ ] **Task 3.2:** Build the checklist UI with per-step attribution and timestamp.

### Phase 4: Rollback Plan
- [ ] **Task 4.1:** Design `public.release_rollback_plans` (`release_id`, `steps` [structured]).
- [ ] **Task 4.2:** Build the equivalent checklist UI.

---

## 7. Sprint Delivery Milestones

**Milestone 1 — Readiness Checklist Live** *(Target: Day 3)*
Checklist schema and UI working, with organization-level customization functional.

**Milestone 2 — Approval Gate Working** *(Target: Day 6)*
Both Enterprise and non-Enterprise routing paths verified correct; exit-criteria precondition enforced.

**Milestone 3 — Deployment Plan Working** *(Target: Day 8)*
Structured, checkable deployment steps functional with attribution.

**Milestone 4 — Rollback Plan & Sprint Sign-Off** *(Target: Day 9)*
Rollback plan functional; all Section 4 acceptance criteria pass.

---

## 8. Open Questions Carried Into This Sprint

- **Checklist customization scope:** allow organization-level customization of default readiness categories/items, since different organizations will have genuinely different release standards.
- **Exit criteria vs. readiness checklist:** keep these two lists conceptually distinct (scope-complete vs. safe-to-ship) rather than merging them.
- **Enterprise-without-workflows edge case:** an Enterprise-tier organization that hasn't actually enabled approval workflows should still use the standalone Change Request Log path, not be forced into `ApprovalRequest` just because of tier.


Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.
---

---

*End of Sprint 45 PRD. Task 2.2's tier-aware routing is the piece most likely to cause confusion if built carelessly — an organization seeing two disconnected records of the same release decision would be worse than not having this feature.*