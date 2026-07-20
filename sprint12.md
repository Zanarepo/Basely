Product Requirements Document (PRD)
Sprint 12: Documentation Engine — Document Engine Foundation & Project Charter

1. Objective & Scope
The objective of Sprint 12 is to build the shared document templating infrastructure that every document type in this phase will reuse, validated against a real first document type — the Project Charter — rather than designed in the abstract.
By the end of this sprint, a Project Manager will be able to:
Generate a Project Charter automatically populated from project setup data
Edit free-text sections (business case, objectives, assumptions) without those edits being overwritten
Regenerate the document at any time, refreshing data-bound sections while preserving free-text content
Out of scope for this sprint: WBS Dictionary, RACI Matrix, and Status Report documents (Sprints 13–14 — though this sprint's templating engine must be proven reusable enough to support them), and any export format beyond an in-app formatted view (export is Sprint 15).
Hard dependency: This sprint requires Foundation (Sprint 1) for the project setup data (name, client, dates, currency, methodology) that the Charter's data-bound sections read from. It has no dependency on Planning Core, Cost Core, or Accountability Layer.

2. User Stories
As a Project Manager, I want a Project Charter automatically generated from my project's setup data, so that I don't have to manually retype information the system already has.
As a Project Manager, I want to edit sections of the charter that need judgment — like the business case — while the data-driven sections stay auto-populated, so I'm not stuck choosing between fully automated and fully manual.
As a Project Manager, I want to regenerate my charter after project details change, without losing the narrative I already wrote.

3. Functional Requirements
3.1 Document Templating Engine
Define a document as a set of sections, each classified as one of:
Data-bound: rendered from a live query against existing project data; never directly editable, always current at view/regeneration time.
Free-text: PM-authored content, persisted independently and never overwritten by regeneration.
The engine's section structure must be generic enough to support tabular/hierarchical data-bound sections (needed by Sprint 13's WBS Dictionary and RACI Matrix), not just flat key-value fields — this sprint should prototype at least one such section as validation, even though the Charter itself doesn't strictly need it.
Support a regenerate action that refreshes all data-bound sections to current values while leaving every free-text section untouched.
3.2 Project Charter Document
Data-bound sections, pulled from Foundation's project setup:
Project name, client name, target start/finish dates, primary currency, methodology (Waterfall/Agile/Hybrid)
Free-text sections, authored by the PM:
Business case / justification
High-level objectives
High-level assumptions and constraints
3.3 Document Detail View
A readable, formatted in-app view of the generated charter, clearly distinguishing data-bound sections (e.g., a subtle "auto-populated" indicator) from free-text sections the PM has authored.
A visible "Regenerate" action that triggers the refresh behavior from Section 3.1.

4. Acceptance Criteria
Generating a charter for a newly created project correctly pulls all data-bound fields from project setup with zero manual re-entry.
Editing a free-text section, then regenerating the document, preserves the free-text edit while refreshing any data-bound sections that changed.
A prototype tabular/hierarchical data-bound section (built as infrastructure validation, not part of the Charter itself) renders correctly, confirming the engine isn't accidentally scoped only to flat key-value data.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
document_templates and generated_documents inherit the same project-scoped RLS pattern established across every prior phase.
Correctness
Data-bound sections must never silently diverge from their live source tables — no cached copy that could go stale between the project view and the document view.
Data Integrity
Regeneration must never be capable of overwriting free-text content — this is the single most important guarantee this sprint delivers, since violating it would make every future document type in this phase untrustworthy to edit.
Extensibility
The section-definition structure must be reusable by Sprint 13 (WBS Dictionary, RACI Matrix) and Sprint 14 (Status Report) without requiring a schema change to document_templates itself.


6. Implementation Task Breakdown: Sprint 12
[Phase 1: Document Schema & RLS] ──> [Phase 2: Templating Engine Core] ──> [Phase 3: Charter Document] ──> [Phase 4: Document View & Regeneration]

Phase 1: Document Schema & Row Level Security
Goal: Provision the shared tables every document type in this phase will use.
[ ] Task 1.1: Design Document Schema


Create SQL migrations for public.document_templates (id, document_type, section_definitions [JSON: section key, type[data_bound|free_text], data source reference for bound sections]) and public.generated_documents (id, project_id, document_type, generated_at, free_text_content [JSON, keyed by section], is_snapshot).
[ ] Task 1.2: Configure Row Level Security


Enable RLS on both tables, reusing the organization_members-scoped pattern established since Sprint 1.
Phase 2: Templating Engine Core
Goal: Build the generic data-binding and rendering logic, proven against more than just flat fields.
[ ] Task 2.1: Implement Data-Bound Section Rendering


Build the resolver that takes a section's data source reference and renders current live data into the document view.
[ ] Task 2.2: Implement Free-Text Section Persistence


Build storage and retrieval for free-text content, keyed by section, surviving regeneration untouched.
[ ] Task 2.3: Prototype a Tabular/Hierarchical Data-Bound Section


Build one non-Charter example (e.g., a stub rendering of WBS elements) purely to validate the engine handles structured data, not just flat key-value fields — this directly de-risks Sprint 13.
Phase 3: Project Charter Document
Goal: Define and wire the Charter's specific sections using the Phase 2 engine.
[ ] Task 3.1: Define Charter Template


Create the document_templates row for document_type = 'charter', specifying its data-bound and free-text sections per Section 3.2.
[ ] Task 3.2: Wire Data-Bound Sections to Foundation Data


Connect each data-bound Charter section to its source field in the projects table.
[ ] Task 3.3: Build Free-Text Entry UI


Rich-text or structured entry fields for business case, objectives, and assumptions/constraints.
Phase 4: Document View & Regeneration
Goal: Give PMs a usable in-app view and a safe, predictable regeneration action.
[ ] Task 4.1: Build the Document Detail View


Render the full charter, visually distinguishing data-bound from free-text sections.
[ ] Task 4.2: Implement the Regenerate Action


Wire the "Regenerate" button to refresh data-bound sections only, with a confirmation step if this is the first regeneration after free-text edits exist (to build user trust in the preserve-free-text guarantee).

7. Sprint Delivery Milestones
Milestone 1 — Document Schema Live (Target: Day 2) document_templates and generated_documents tables deployed with RLS confirmed.
Milestone 2 — Templating Engine Proven (Target: Day 5) Data-bound and free-text section rendering both work correctly; the tabular/hierarchical prototype section renders successfully, confirming the engine's reusability for Sprint 13.
Milestone 3 — Charter Generates Correctly (Target: Day 7) A charter can be generated for a new project with all data-bound fields correctly populated from Foundation data.
Milestone 4 — Regeneration & Sprint Sign-Off (Target: Day 9) Regeneration correctly refreshes data-bound sections while preserving free-text edits in every tested scenario; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Free-text section persistence across template changes: if a future update to the Charter template adds or removes a section, how should existing free-text content for a removed section be handled — archived, deleted, or left orphaned but inaccessible? Worth a defined policy now rather than an ad hoc decision when it first happens.
Regeneration confirmation UX: should every regeneration require confirmation, or only the first one for a given document (per Task 4.2)? Too much confirmation friction undermines the "regenerate anytime" value proposition; too little risks a PM not trusting that their free-text content is actually safe.
Charter template rigidity: should the three free-text sections (business case, objectives, assumptions/constraints) be fixed for launch, or should the templating engine support a configurable section list even in this first sprint? Recommend fixed sections for Sprint 12, with configurability deferred to the later custom-template enterprise feature.

End of Sprint 12 PRD. This sprint delivers both the first real document type and the infrastructure every other document type in this phase depends on. Sprint 13 should not need to modify document_templates' schema — only add new rows and section resolvers — if this sprint's engine is built generically enough.

