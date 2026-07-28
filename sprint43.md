# Product Requirements Document (PRD)
# Sprint 43: Document Library — True Closure: PM Plan, Budget Baseline Doc, Issue Log Doc, Schedule Doc & Change Management Plan

---

## 1. Objective & Scope

This sprint exists to correct an honest gap: Phase 12 claimed full coverage of the original 25-document list but actually missed four items and left one partially closed. This sprint fixes all five, so the count genuinely reaches 25/25 rather than asserting it.

By the end of this sprint:
- Budget Baseline and Issue Log get the same document-export treatment Sprint 36 gave Stakeholder Register and Risk Register — this should have shipped with that batch and didn't
- A formal, narrative Project Schedule document exists, distinct from the Gantt's visual PDF/PNG snapshot
- A Change Management Plan (the planning-stage process document) exists, separate from the Change Request Log (Sprint 41's execution-stage tracking) — these were incorrectly treated as the same thing
- A Project Management Plan exists as a true master document, linking together every sub-plan now that they all actually exist

**Out of scope for this sprint:** any change to the underlying data these documents read from — every item here is presentation-layer only, consistent with every other Documentation Engine document.

> **Hard dependency:** The Project Management Plan (Section 3.5) is deliberately sequenced last within this sprint because it depends on every other sub-plan document existing first — including three of this sprint's own earlier sections. This is the one internally-sequenced dependency in an otherwise parallelizable sprint.

---

## 2. Why This Sprint Exists (Read Before Estimating Trust in "Complete")

Two of these five gaps (Budget Baseline, Issue Log) were identified in the *same breath* as Stakeholder Register and Risk Register in the original gap analysis — same category, same fix, same cost — and simply didn't make it into Sprint 36's batch. The Change Management Plan gap happened because a planning-stage *process* document got silently treated as equivalent to an execution-stage *tracking log* (Sprint 41), when they're genuinely different artifacts. The Project Management Plan was flagged from the very first gap analysis and then never assigned to any sprint at all across two full phases.

The lesson worth carrying forward, stated plainly: **"we built the category" is not the same claim as "we built every item in the category."** A completion claim needs to be checked item-by-item against the original list, not phase-by-phase against the PRDs that were written about it.

---

## 3. Functional Requirements

### 3.1 Budget Baseline Document (Fast-Follow)
- Fully data-bound export of Cost Core's Sprint 5 budget baseline: work-package-level estimates, time-phased distribution, S-curve, contingency/reserve status.
- Same treatment as Sprint 36: `is_snapshot = false`, reuses Documentation Engine's existing engine with zero core modifications.

### 3.2 Issue Log Document (Fast-Follow)
- Fully data-bound export of Accountability Layer's Sprint 11 issue log: title, status, owner, linked risk (if any), date raised.
- Same treatment as Sprint 36: `is_snapshot = false`, reuses the existing engine.

### 3.3 Formal Project Schedule Document
- A narrative document distinct from the Gantt's visual snapshot export (Sprint 4): data-bound baseline dates, milestone list, and key dependencies/critical path summary, plus free-text sections for scheduling assumptions and constraints.
- This is the schedule equivalent of the WBS Dictionary — a readable document form of schedule data, not a second visualization of the chart itself.

### 3.4 Change Management Plan
- New entity, genuinely distinct from Sprint 41's Change Request Log: captures the *process* for handling scope/schedule/budget changes — approval thresholds, who's authorized to approve what size of change, and the general workflow description.
- For Enterprise organizations, this document should reference the actual configured Approval Workflow policy (Administration & Governance's Sprint 22) as its data-bound "how changes are actually gated today" section; for other tiers, it's a purely descriptive/free-text process document since no gating mechanism exists to reference.
- Free-text: change management philosophy, escalation process, roles involved.

### 3.5 Project Management Plan (Master Document)
- A true aggregator document, not a new source of data: links together and summarizes every sub-plan that now exists — Scope Statement (Sprint 38), Schedule Document (Section 3.3, this sprint), Budget Baseline Document (Section 3.1, this sprint), Risk Register (Sprint 36), Communication Plan (Sprint 38), Resource Plan/RACI (Sprint 13), Quality Management Plan (Sprint 39), Procurement Plan (Sprint 39), Change Management Plan (Section 3.4, this sprint).
- Rendered as a summary-plus-links document: a short data-bound summary of each sub-plan's key points, with a direct reference/link to the full sub-plan document itself — this document should never duplicate the full content of any sub-plan, only summarize and point to it.
- This is the one document type in the entire platform whose primary job is *referencing other documents*, not source data — its resolver should read from `GeneratedDocument` records of other types, not from raw project tables directly.

---

## 4. Acceptance Criteria

- Budget Baseline and Issue Log documents generate correctly, matching live data exactly, exportable in every format Sprint 15 supports.
- The Project Schedule document renders correctly with baseline dates, milestones, and critical path summary distinct from (and not a duplicate of) the Gantt's visual export.
- The Change Management Plan is confirmed, in a design review, to be a genuinely distinct entity from the Change Request Log — not the same data presented twice.
- For an Enterprise organization with approval workflows enabled, the Change Management Plan correctly reflects the actual configured policy; for other tiers, it renders correctly as a standalone descriptive document.
- The Project Management Plan correctly links to and summarizes all nine sub-plans, with zero content duplication — updating a sub-plan's underlying data correctly updates its summary in the Project Management Plan without manual sync.

---

## 5. Non-Functional & Security Requirements

| Requirement | Detail |
|---|---|
| **No Duplication (Project Management Plan)** | This document must reference other `GeneratedDocument` records, not copy their content — this is the same "reference, don't duplicate" principle already applied to Sprint 26's cloud file attachments. |
| **Distinctness (Change Management Plan)** | Must be verifiably distinct from Sprint 41's Change Request Log in a design review before this sprint is marked complete — this is the specific failure this sprint exists to correct, so it needs an explicit check, not an assumption. |
| **Consistency** | All five items reuse Documentation Engine's existing Sprint 12 templating engine — zero new rendering infrastructure. |

---

## 6. Implementation Task Breakdown: Sprint 43

```
[Phase 1: Budget Baseline & Issue Log Fast-Follow] ──> [Phase 2: Formal Schedule Document] ──> [Phase 3: Change Management Plan] ──> [Phase 4: Project Management Plan Aggregator]
```

### Phase 1: Budget Baseline & Issue Log Fast-Follow
- [ ] Task 1.1: Define `document_type = 'budget_baseline'` and `'issue_log'` templates using Sprint 12's schema.
- [ ] Task 1.2: Build resolvers for both, matching the exact pattern used in Sprint 36.

### Phase 2: Formal Schedule Document
- [ ] Task 2.1: Define `document_type = 'schedule_document'` template.
- [ ] Task 2.2: Build the resolver pulling baseline dates, milestones, and critical path summary from Planning Core (Sprint 3/4), distinct from the visual Gantt export.

### Phase 3: Change Management Plan
- [ ] Task 3.1: Design `public.change_management_plans` (`id`, `project_id`, `approval_thresholds`, `escalation_process`, `roles_description`).
- [ ] Task 3.2: Build the tier-aware resolver: Enterprise-with-workflows reads Sprint 22's actual policy configuration; all other cases render the standalone descriptive document.
- [ ] Task 3.3: Conduct the design review confirming distinctness from the Change Request Log — a required, documented checkpoint.

### Phase 4: Project Management Plan Aggregator
- [ ] Task 4.1: Design `public.project_management_plan_links` (`project_id`, referencing the current `GeneratedDocument` id for each of the 9 sub-plan types).
- [ ] Task 4.2: Build the summary-plus-link resolver, reading summaries from each sub-plan's own data rather than duplicating content, with a direct reference to the full document.

---

## 7. Sprint Delivery Milestones

**Milestone 1 — Fast-Follow Documents Live** *(Target: Day 2)*
Budget Baseline and Issue Log documents working, matching the Sprint 36 pattern exactly.

**Milestone 2 — Schedule Document Live** *(Target: Day 4)*
Formal schedule document renders correctly, distinct from the Gantt visual export.

**Milestone 3 — Change Management Plan Live & Verified Distinct** *(Target: Day 6)*
Tier-aware Change Management Plan working; design review confirms it's not a duplicate of the Change Request Log.

**Milestone 4 — Project Management Plan & Sprint Sign-Off** *(Target: Day 8)*
Master aggregator document correctly links and summarizes all nine sub-plans with zero duplication; all Section 4 acceptance criteria pass — this milestone finally closes the full 25-document list for real.

---

## 8. Open Questions Carried Into This Sprint

- **Project Management Plan staleness protection:** since this document links to nine other documents, how does it behave if one of those sub-plans is later deleted or its document type is removed? Recommend the link resolve to "not available" gracefully rather than breaking the whole aggregator document if one sub-plan is missing.
- **Change Management Plan default thresholds:** should the platform ship reasonable default approval thresholds (e.g., "changes over $X require Admin approval") that a PM can edit, or start entirely blank? Recommend sensible defaults to reduce blank-page friction, editable per project.

---

## 9. Final Verification

After this sprint, re-run the full 25-item check one more time against the original list. This is now the third time this verification has been explicitly built into the plan (Sprint 39→42's design review, and now this sprint) — treat that repetition as intentional, not redundant: a completion claim on a 25-item list is exactly the kind of thing that's easy to overstate by category and only catch by counting line by line.

---

*End of Sprint 43 PRD. This sprint is the actual finish line for the Document Library effort — not Sprint 42, despite what was claimed at the time.*