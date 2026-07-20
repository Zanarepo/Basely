Product Requirements Document (PRD)
Sprint 13: Documentation Engine — WBS Dictionary & RACI Matrix Export

1. Objective & Scope
The objective of Sprint 13 is to build the WBS Dictionary and RACI Matrix documents — the second and third document types in this phase, both fully data-bound with no free-text sections, proving the Sprint 12 templating engine handles tabular and hierarchical data cleanly, not just the flat key-value data of a Charter.
By the end of this sprint, a Project Manager will be able to:
Generate a WBS Dictionary listing every work package's description, deliverables, acceptance criteria, and current owner
Generate a RACI Matrix document that's readable by someone with no platform access, with unowned work clearly flagged
See both documents stay correctly current as the underlying WBS/RACI data changes
Out of scope for this sprint: Status Report (Sprint 14 — the first document to pull from multiple phases at once) and any export format beyond the in-app formatted view (Sprint 15).
Hard dependency: This sprint requires Sprint 12's templating engine to be complete, Planning Core's WBS (Sprint 2) for the dictionary content, and Accountability Layer's RACI assignments (Sprint 10) for the matrix content — including Sprint 10's unowned-work detection logic, which this sprint's RACI document must reuse, not reimplement.

2. User Stories
As a Project Manager, I want a WBS Dictionary document generated from my WBS, so that I can hand stakeholders a clear description of every work package without manually compiling one.
As a Project Manager, I want a RACI Matrix document generated from my RACI assignments, so that I can share accountability clearly with people who will never log into the platform.
As a Project Manager, I want unowned work clearly flagged in the RACI document, so that an external reader doesn't mistake "blank" for "not yet decided" versus "genuinely unowned."

3. Functional Requirements
3.1 WBS Dictionary Document
Fully data-bound (no free-text sections), listing every WBS work package (is_work_package = true) with:
WBS code and name
Description
Deliverables
Acceptance criteria
Current Accountable stakeholder (from Sprint 10's RACI data)
Structured hierarchically to mirror the live WBS tree — a reader should be able to follow the document's structure the same way they'd follow the in-app WBS view.
3.2 RACI Matrix Document
A formatted grid or list rendering of RACI assignments (from Sprint 10), showing for every work package who holds each of the four roles.
Must be genuinely readable by someone unfamiliar with the app's UI conventions — role labels should be spelled out or clearly legended, not assume prior knowledge of "R/A/C/I" shorthand without explanation.
Unowned work must be visibly flagged, reusing Sprint 10's unowned-work detection logic directly rather than reimplementing the check — this document must never silently show a blank cell where the app would show a warning.
3.3 Live Data Accuracy
Both documents must reflect the current live state of their source data at generation/view time — no cached copy that could silently go stale, consistent with the correctness requirement established in Sprint 12.

4. Acceptance Criteria
A WBS Dictionary generated for a 20-work-package project correctly includes every work package with accurate description/deliverable/acceptance-criteria/owner data, matching the live WBS exactly.
A RACI Matrix document correctly represents every assignment from the live RACI data, with unowned items visibly flagged rather than silently blank — verified against a test project with deliberately planted unowned items.
Regenerating either document after a live data change (e.g., editing a work package's description, or reassigning an Accountable stakeholder) reflects the change immediately, with no manual cache-clearing step.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
Both document types inherit the same document_templates/generated_documents RLS pattern established in Sprint 12.
Correctness
Zero tolerance for stale data in either document — this is a direct extension of Sprint 12's core guarantee, now tested against genuinely hierarchical (WBS) and relational (RACI) data rather than flat fields.
Consistency with Source Logic
The RACI document's unowned-work flagging must call the same detection logic Sprint 10 built for in-app use, not a separately maintained copy — two implementations of the same check are a correctness risk waiting to diverge.
Readability
The RACI document specifically must be legible to a non-platform-user — this is a UX requirement as much as a functional one, since the entire purpose of exporting a RACI chart is external sharing.


6. Implementation Task Breakdown: Sprint 13
[Phase 1: Template Definitions] ──> [Phase 2: WBS Dictionary Rendering] ──> [Phase 3: RACI Matrix Rendering] ──> [Phase 4: Unowned-Work Flagging Integration]

Phase 1: Template Definitions
Goal: Define both new document types using Sprint 12's existing schema, with no schema changes required.
[ ] Task 1.1: Define WBS Dictionary Template


Create the document_templates row for document_type = 'wbs_dictionary', specifying its fully data-bound section structure.
[ ] Task 1.2: Define RACI Matrix Template


Create the document_templates row for document_type = 'raci', specifying its grid-structured, fully data-bound sections.
Phase 2: WBS Dictionary Rendering
Goal: Build the hierarchical rendering logic for the dictionary document.
[ ] Task 2.1: Build WBS Data Resolver


Query all work packages for a project, including their linked Accountable stakeholder, structured to preserve WBS hierarchy.
[ ] Task 2.2: Build Hierarchical Document Rendering


Render the resolved data into a document view that mirrors the WBS tree structure (indentation/nesting matching the in-app tree from Sprint 2).
Phase 3: RACI Matrix Rendering
Goal: Build the grid rendering logic for the RACI document.
[ ] Task 3.1: Build RACI Data Resolver


Query all RACI assignments for a project, structured as a work-package × stakeholder grid.
[ ] Task 3.2: Build Grid Document Rendering


Render the resolved data as a readable grid/list, with role labels spelled out clearly for a non-platform-user audience.
Phase 4: Unowned-Work Flagging Integration
Goal: Ensure the RACI document never silently omits the single most important piece of information Sprint 10 was built to surface.
[ ] Task 4.1: Reuse Sprint 10's Detection Query


Call the same unowned-work detection logic built in Sprint 10, rather than reimplementing an equivalent check.
[ ] Task 4.2: Build Visible Flagging in the Document


Render a clear, unmistakable flag (not just an empty cell) for any work package missing a Responsible or Accountable assignment.

7. Sprint Delivery Milestones
Milestone 1 — Templates Defined (Target: Day 2) Both document_templates rows created and validated against Sprint 12's existing schema with zero schema modifications required.
Milestone 2 — WBS Dictionary Renders Correctly (Target: Day 5) Dictionary document correctly renders all work packages with accurate, hierarchically-structured data matching the live WBS.
Milestone 3 — RACI Matrix Renders Correctly (Target: Day 7) RACI document correctly renders the full assignment grid, legible to a non-platform-user audience.
Milestone 4 — Unowned-Work Flagging & Sprint Sign-Off (Target: Day 9) Unowned work is correctly and visibly flagged in the RACI document using Sprint 10's shared detection logic; both documents pass all Section 4 acceptance criteria, including live-data-change regeneration tests.

8. Open Questions Carried Into This Sprint
RACI role label conventions: should the document spell out "Responsible / Accountable / Consulted / Informed" in full, or use the R/A/C/I shorthand with a legend at the top? Recommend full labels in the grid itself with a compact legend, since some external readers will skim without reading a legend first.
WBS Dictionary summary-element treatment: the dictionary is scoped to work packages only (Section 3.1) — should summary/grouping WBS elements also appear as section headers for readability, even though they have no description/deliverable content of their own? Likely yes for readability, but confirm before Task 2.2 finalizes the rendering structure.
Multiple Responsible/Consulted/Informed display: when a cell has multiple stakeholders in the same role (e.g., two Responsible parties), how should the document render that — a comma-separated list, stacked names, or initials with a legend? Worth a quick design decision before Task 3.2, since this affects the grid's readability at scale.

End of Sprint 13 PRD. This sprint proves the Sprint 12 templating engine handles real hierarchical and relational data without any schema changes — direct validation that the foundation sprint's infrastructure investment was well-scoped. Sprint 14 (Status Report) is a bigger step up in complexity: the first document type to pull from multiple, previously-unrelated phases at once.

