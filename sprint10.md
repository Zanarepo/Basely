Product Requirements Document (PRD)
Sprint 10: Accountability Layer — RACI Matrix

1. Objective & Scope
The objective of Sprint 10 is to build the RACI matrix — mapping Responsible, Accountable, Consulted, and Informed roles from the Sprint 9 stakeholder register onto the WBS elements and activities from Planning Core, and finally replacing the single-owner placeholder that Phase 2 deliberately left in place for exactly this purpose.
By the end of this sprint, a Project Manager will be able to:
Assign RACI roles to any WBS element or activity, using stakeholders from the Sprint 9 register
See at a glance which work has no owner, before it becomes a problem in a status meeting
View a full RACI grid for a project, not just one assignment at a time
See any stakeholder's full workload across every project they're part of
Out of scope for this sprint: risk/issue ownership (Sprint 11 — though it will reuse this sprint's stakeholder-assignment patterns) and any auto-generated, formatted RACI document export (a later Documentation Engine phase).
Hard dependency: This sprint requires Sprint 9 (Stakeholder Register) for the people being assigned, and Phase 2's WBS/Schedule for the work being assigned to. It also directly consumes and retires the WBSElement.owner_id field from Phase 2 — that field was kept specifically so this sprint could migrate it, not deleted as dead weight.

2. User Stories
As a Project Manager, I want to assign RACI roles for each work package or activity, so that accountability is explicit instead of assumed.
As a Project Manager, I want to be automatically warned when a piece of work has no Responsible or Accountable person assigned, so that nothing falls through the cracks silently.
As a Project Manager, I want to see a full RACI grid for my project, so that I can review the whole accountability picture at once instead of clicking into each item individually.
As a Project Manager, I want to see a stakeholder's workload across all their projects, so that I can spot overload before it becomes a real bottleneck.

3. Functional Requirements
3.1 RACI Assignment
For any WBS element or activity, assign one or more stakeholders (from Sprint 9) to one of four roles:
Responsible — does the work
Accountable — owns the outcome; constrained to exactly one stakeholder per item, enforced at the data layer, not just the UI
Consulted — provides input before/during the work
Informed — kept updated on progress/outcome
Multiple stakeholders can hold Responsible, Consulted, or Informed roles on the same item.
3.2 Default Migration from Phase 2
On this sprint's rollout, existing WBSElement.owner_id values should pre-populate as the Accountable assignment for their respective work packages, so PMs start with a partially-filled matrix rather than a blank one.
This migration is a one-time data seed, not an ongoing sync — after migration, RaciAssignment is the sole source of truth, and owner_id should not be read by any code written after this sprint ships.
3.3 Unowned Work Detection
Automatically detect and flag any WBS element/activity missing a Responsible or Accountable assignment.
Flags must be surfaced proactively (e.g., a visible indicator in the WBS/Gantt views and a dedicated "unassigned work" list), not something the PM has to go looking for.
3.4 RACI Matrix Grid View
A grid view showing stakeholders as columns (or rows) and WBS elements/activities as the other axis, with each cell showing the assigned role(s), if any.
Support filtering/scoping the grid (e.g., by WBS branch, by stakeholder) so it stays usable on large projects rather than becoming an unreadable wall of cells.
3.5 Cross-Project Workload View
For a given stakeholder, show all of their Responsible and Accountable assignments across every project they're part of within the workspace — not just the currently open project.
This view should make overload visible at a glance (e.g., a simple count or list, not requiring the PM to manually cross-reference multiple project views).

4. Acceptance Criteria
A PM can build a complete RACI matrix for a 20-work-package project, with every item having at least a Responsible and an Accountable assignment, in under 20 minutes.
The unowned-work flag correctly identifies every work package/activity missing R or A, with zero false negatives, verified against a test project with deliberately planted gaps.
Attempting to assign a second Accountable stakeholder to the same item is rejected (or automatically replaces the prior Accountable, per the UX decision in Section 8) — never silently allowed to create two.
A stakeholder's cross-project workload view correctly aggregates assignments from every project they're part of, not just the currently active one.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
raci_assignments inherits the same project-scoped RLS pattern established across every prior phase; the cross-project workload view (Section 3.5) is the one deliberate exception that reads across projects, and must do so only for projects the requesting user has legitimate access to.
Data Integrity
The "exactly one Accountable per item" rule is enforced at the database layer (e.g., a partial unique constraint), not only in application code, so no direct API call can bypass it.
Correctness
Unowned-work detection must have zero false negatives — a missed flag defeats the entire purpose of this sprint.
Migration Safety
The one-time owner_id → RaciAssignment migration (Section 3.2) must be idempotent and safely re-runnable without creating duplicate Accountable assignments if run more than once.


6. Implementation Task Breakdown: Sprint 10
[Phase 1: RACI Schema & RLS] ──> [Phase 2: Owner Migration] ──> [Phase 3: Assignment UI] ──> [Phase 4: Unowned Work Detection] ──> [Phase 5: Matrix Grid & Workload Views]

Phase 1: RACI Schema & Row Level Security
Goal: Provision the table that holds RACI assignments, linked to both the WBS/schedule (Phase 2) and stakeholder register (Sprint 9).
[ ] Task 1.1: Design RACI Assignment Schema


Create a SQL migration for public.raci_assignments (id, wbs_element_id FK [or activity_id, per Section 8's scoping decision], stakeholder_id FK, role_type enum [R/A/C/I]).
[ ] Task 1.2: Enforce Single-Accountable Constraint


Add a partial unique constraint (or equivalent) ensuring at most one role_type = 'A' row exists per WBS element/activity.
[ ] Task 1.3: Configure Row Level Security


Enable RLS on raci_assignments, reusing the organization_members-scoped pattern established since Sprint 1.
Phase 2: Owner Migration
Goal: Carry forward the Phase 2 placeholder data so this sprint doesn't force PMs to start over.
[ ] Task 2.1: Build Migration Script


Write a one-time, idempotent migration that creates an Accountable raci_assignments row for every WBS element with a non-null owner_id, mapping to the corresponding stakeholder (requires resolving owner_id's underlying user to a stakeholder_id — see Section 8 for how internal stakeholders link to users).
[ ] Task 2.2: Validate Migration Coverage


Confirm every previously-owned work package correctly has exactly one Accountable assignment post-migration, with no data loss or duplication.
Phase 3: RACI Assignment UI
Goal: Let a PM assign and edit roles quickly, ideally without leaving the WBS or Gantt view they're already working in.
[ ] Task 3.1: Build Inline Assignment Interface


Add a RACI assignment control accessible from the WBS tree (Sprint 2) and/or Gantt activity detail (Sprint 4), so assignment doesn't require a fully separate screen.
[ ] Task 3.2: Build Stakeholder Picker


Searchable picker sourced from the Sprint 9 stakeholder register, supporting multi-select for R/C/I and single-select for A.
[ ] Task 3.3: Handle Accountable Reassignment


Implement the UX for changing who's Accountable on an item — per Section 8, either an explicit "reassign" action or automatic replacement, but never a state that allows two.
Phase 4: Unowned Work Detection
Goal: Make missing accountability impossible to miss.
[ ] Task 4.1: Build Detection Query


Query for all WBS elements/activities lacking a Responsible or Accountable assignment.
[ ] Task 4.2: Surface Flags in Existing Views


Add a visible indicator (e.g., a badge or icon) on unowned items directly within the WBS tree and Gantt views.
[ ] Task 4.3: Build a Dedicated "Unassigned Work" List


A standalone view listing every unowned item project-wide, so a PM can address gaps in one pass rather than hunting through the tree.
Phase 5: Matrix Grid & Cross-Project Workload Views
Goal: Give PMs the two higher-level views that make the underlying assignment data actually useful for planning and communication.
[ ] Task 5.1: Build the RACI Grid View


Render the full stakeholder × WBS-element grid, with filtering by WBS branch and/or stakeholder to keep it usable at scale.
[ ] Task 5.2: Build Cross-Project Workload View


For a selected stakeholder, aggregate and display their R/A assignments across every project in the workspace they have access to.

7. Sprint Delivery Milestones
Milestone 1 — RACI Data Layer & Migration Live (Target: Day 3) raci_assignments table deployed with RLS and the single-Accountable constraint confirmed; the Phase 2 owner_id migration has run and validated with zero data loss.
Milestone 2 — Assignment UI Working (Target: Day 6) PMs can assign and edit R/A/C/I roles inline from the WBS/Gantt views, with correct handling of Accountable reassignment.
Milestone 3 — Unowned Work Detection Live (Target: Day 8) Unowned items are flagged with zero false negatives, both inline in existing views and in a dedicated list.
Milestone 4 — Grid, Workload View & Sprint Sign-Off (Target: Day 10) RACI grid view and cross-project workload view both function correctly; all Section 4 acceptance criteria pass, including the 20-work-package/under-20-minutes scenario.

8. Open Questions Carried Into This Sprint
RACI scoping level: should assignments be made at the WBS-element level, the activity level, or both? Phase 2 established a 1:1 WBS-to-activity relationship for work packages, so in practice these may be interchangeable — but the schema decision (Task 1.1) needs to pick one canonical reference to avoid two disconnected sources of truth.
Accountable reassignment UX: when a PM assigns a new Accountable to an item that already has one, should the system require an explicit "replace" confirmation, or silently swap the assignment? Recommend requiring confirmation, consistent with the platform's general pattern of not silently overwriting accountability-related data (mirrors the reconciliation-confirmation pattern from Cost Core's Sprint 6).
Multiple Responsible parties: as flagged in the Phase 4 PRD, should the product allow unlimited Responsible assignees per item, or nudge toward a single Responsible party as a best practice even though it isn't a strict RACI rule? Affects Task 3.2's picker UX (single vs. multi-select default).
owner_id migration mapping for unlinked stakeholders: if a WBS element's owner_id points to a platform user who hasn't yet been added to the Sprint 9 stakeholder register, should the migration auto-create a stakeholder record for them, or skip that item and flag it for manual RACI assignment? Recommend auto-creating a linked stakeholder record to maximize migration coverage.

End of Sprint 10 PRD. This sprint retires the last piece of Phase 2's placeholder accountability model and gives the platform its first real cross-cutting view (workload) that spans multiple projects rather than living inside a single one. Sprint 11 (Risk & Issue Register) reuses this sprint's stakeholder-assignment patterns for risk and issue ownership.

