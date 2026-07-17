Product Requirements Document (PRD)
Sprint 2: Planning Core — WBS Data Model & Tree UI

1. Objective & Scope
The objective of Sprint 2 is to build the Work Breakdown Structure (WBS) — the hierarchical planning spine that every later module (scheduling, budget, RACI, risk) will attach to.
By the end of this sprint, a Project Manager will be able to:
Build, edit, and freely restructure a multi-level WBS for a project
Do all of this entirely through an interactive tree UI
Trust that hierarchy codes stay correct automatically at every step
Out of scope for this sprint: scheduling, dates, and Critical Path logic. This layer only needs to exist correctly so the next sprint has something valid to schedule against.
Hard dependency: This sprint requires Sprint 1 (Foundation) to be complete. The WBS table hangs directly off public.projects, and its security model directly extends the RLS/RBAC pattern already established in Sprint 1.

2. User Stories
As a Project Manager, I want to build a multi-level Work Breakdown Structure for my project, so that I can decompose scope into manageable, trackable pieces before scheduling begins.
As a Project Manager, I want WBS codes (1, 1.1, 1.1.1…) to update automatically as I add, delete, or reorder elements, so that I never have to manually renumber my plan.
As a Project Manager, I want to drag and drop WBS elements to reorder or move them under a different parent, so that I can restructure my plan as my understanding of scope evolves — without losing work if I make a mistake.

3. Functional Requirements
3.1 WBS Data Model & Persistence
Provision a public.wbs_elements table storing:
Hierarchy: parent_id, sort_order
Identity: project_id, code
Planning content: name, description, owner_id, deliverables, acceptance_criteria, status, is_work_package
Every WBS element belongs to exactly one project.
A parent_id must always reference an element within the same project.
3.2 Hierarchy & Auto-Numbering
Automatically calculate and persist hierarchical WBS codes (e.g., 1, 1.1, 1.2, 1.2.1) that stay correct after any insert, delete, move, or reorder.
No manual renumbering should ever be required.
Structurally prevent invalid tree states:
A node can never become its own ancestor (cycle prevention).
A node can never be reparented into a different project.
3.3 Tree UI & CRUD Interactions
Render the WBS as a collapsible, indented tree showing each element's auto-generated code, name, and status.
Support the following directly from the tree, with no separate page navigation required:
Create (add child / add sibling)
Rename
Edit (description, owner, deliverables, acceptance criteria, status, work-package flag)
Delete
Support undo/redo (minimum 20 steps) for structural edits, so a PM can experiment with restructuring without fear of losing work.
3.4 Drag-and-Drop Reorder & Reparenting
Support dragging an element to reorder it among siblings.
Support dragging an element onto a different parent to move it — along with all of its children — into a new branch.
Reject any drag operation that would create a cycle, with a clear on-screen error, before the change is committed.

4. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
wbs_elements must be protected by PostgreSQL Row Level Security, scoped through organization_members exactly as established in Sprint 1 — a user must only be able to read or write WBS data for projects inside workspaces they belong to.
Performance
The tree UI must remain responsive on trees of 500+ elements; recalculating hierarchy codes after a structural change must feel instantaneous, not require a manual refresh.
Data Integrity
Auto-numbering and hierarchy validation must be enforced at the database layer, not only in the frontend, so no client can bypass the rules through a direct API call.


5. Implementation Task Breakdown: Sprint 2
This breakdown details the execution sequence required to build the WBS data layer and wire it to the Next.js frontend tree UI.
[Phase 1: DB Schema & RLS] ──> [Phase 2: Hierarchy Engine] ──> [Phase 3: Tree UI & CRUD] ──> [Phase 4: Drag-and-Drop]
Phase 1: WBS Database Schema & Row Level Security
Goal: Construct the WBS table, enforce project-scoped data integrity, and lock down security at the database layer, extending Sprint 1's tenant-isolation pattern.
Task 1.1: Design WBS Table Schema
Create a SQL migration script defining public.wbs_elements: id, project_id (FK → projects), parent_id (FK → wbs_elements, self-referencing, nullable), code, name, description, owner_id (FK → profiles), deliverables, acceptance_criteria, status enum (Not Started / In Progress / Complete / On Hold), is_work_package boolean, sort_order, created_at, updated_at.
Add composite indexes on (project_id, parent_id) and (project_id, sort_order) to keep tree queries fast as trees grow.
Task 1.2: Enforce Structural Data Integrity
Write a PostgreSQL trigger/function that rejects a parent_id belonging to a different project_id than the child, preventing cross-project parenting at the data layer.
Task 1.3: Configure Row Level Security (RLS) Policies
Enable RLS on wbs_elements.
Write policies checking that the authenticated user's ID exists within organization_members for the org that owns the element's project — reusing the get_user_permissions RPC from Sprint 1.
Restrict write/delete access to Admin/PM roles; Team Member and Viewer get read-only access.
Phase 2: Hierarchy & Auto-Numbering Engine
Goal: Guarantee the WBS tree is always structurally valid and always correctly numbered, entirely server-side.
Task 2.1: Build Auto-Numbering Calculation Function
Write a PL/pgSQL function recalculate_wbs_codes(project_id) that walks the tree by parent_id/sort_order and assigns correct hierarchical codes.
Trigger this automatically on insert, delete, reparent, and reorder — scoped to only the affected subtree for performance.
Task 2.2: Implement Cycle Prevention
Write a function/constraint that rejects any parent_id update which would make a node its own descendant's child, with a clear error returned to the caller.
Task 2.3: Define Cascade-Delete Behavior
Decide and implement what happens to children when a parent element is deleted: cascade-delete the full subtree, or reparent children up to the grandparent.
Flagged as an open product decision — see Section 6.
Task 2.4: Validate with a Reference Test Suite
Build integration tests running insert, delete, move, and reorder operations against a 100-element fixture tree, confirming codes are always correct and no invalid state is reachable.
Phase 3: Tree UI Rendering & CRUD Interactions
Goal: Give Project Managers a fast, intuitive interface to build and edit their WBS without needing to understand the underlying hierarchy engine.
Task 3.1: Build the Recursive Tree Component
Develop a React tree component rendering wbs_elements by parent_id, with indentation and each element's auto-generated code shown per row.
Implement expand/collapse per node (client-side state only this sprint) and row virtualization so large trees (500+ nodes) stay smooth.
Task 3.2: Build CRUD Forms & Inline Editing
Add inline "Add child / Add sibling" actions on each tree row.
Build a side-panel detail form (Zod-validated) for editing description, owner, deliverables, acceptance criteria, status, and the work-package flag.
Build a delete confirmation modal that shows descendant impact based on Phase 2's cascade-delete decision.
Wire all actions to Supabase with optimistic UI updates and rollback on error.
Task 3.3: Implement Undo/Redo
Build a client-side action history stack (minimum 20 steps) covering create, delete, rename, and move operations.
Wire keyboard shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) and toolbar buttons.
Ensure undo/redo correctly re-triggers server-side code recalculation.
Phase 4: Drag-and-Drop Reorder & Reparenting
Goal: Let Project Managers visually restructure the WBS tree, with every change validated and committed through the hierarchy engine in real time.
Task 4.1: Implement Same-Parent Reorder
Integrate a drag-and-drop library (e.g., dnd-kit) with visual drop-position indicators.
On drop, compute new sort_order values and persist via Supabase, triggering auto-numbering recalculation.
Apply optimistic UI updates with rollback on failure.
Task 4.2: Implement Cross-Branch Reparenting
Extend drag-and-drop to detect cross-branch drops and confirm the target as a new parent.
Call server-side cycle validation before committing; show a clear error and cancel the drop if the move is invalid.
Verify children move correctly with their parent and codes recalculate correctly throughout the affected branches.
Task 4.3 (Stretch / Fast-Follow): Bulk Multi-Select Move
Add multi-select support (shift-click, cmd/ctrl-click) to the tree.
Extend drag-and-drop to move all selected nodes together, preserving relative order.
Treat as fast-follow if sprint capacity is tight.


Milestones

Milestone 1 — Data Layer Integrity (Target: Day 3)
 wbs_elements table deployed, RLS confirmed to block cross-tenant reads/writes, and recalculate_wbs_codes passes the 100-element fixture test suite.
Milestone 2 — Tree UI Renders & CRUD Works (Target: Day 6)
 A PM can create, rename, edit details of, and delete WBS elements through the tree UI, with codes always correct on screen and no orphaned/invalid states reachable through the UI.
Milestone 3 — Reorder & Undo Stable (Target: Day 8)
 Drag-and-drop reorder within a parent works with correct code recalculation; undo/redo correctly reverses the last 20 structural actions without desyncing codes.
Milestone 4 — Reparenting & Sprint Sign-Off (Target: Day 10)
 Cross-branch drag-and-drop reparenting works, cycle attempts are rejected with a clear error, and a 100-element WBS can be built and freely restructured in usability testing without a single incorrect code or crash.

6. Open Questions Carried Into This Sprint
Cascade-delete behavior (Task 2.3): Should deleting a parent cascade-delete all descendants, or reparent children to the grandparent? This has real data-loss implications and should be decided before Phase 2 implementation begins.
Bulk multi-select move (Task 4.3): Confirm whether this is in-sprint or explicitly deferred, since it's the only stretch item in this plan.
Default ownership behavior: Confirm whether owner_id should default to the project creator or stay unassigned until explicitly set — affects Task 3.2's form default behavior.


