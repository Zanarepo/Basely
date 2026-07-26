Product Requirements Document (PRD)
Sprint 37: Document Library — Business Case & Feasibility Study

1. Objective & Scope
Build the two Initiation-stage documents that have no data model anywhere in the platform: the Business Case and the (optional) Feasibility Study. Unlike Sprint 36, this sprint introduces genuinely new entities.
By the end of this sprint, a PM (or a prospective PM evaluating a project that doesn't formally exist yet) can create a Business Case, optionally attach a Feasibility Study, and later link both to a real project record once one is created.
Out of scope: any approval/governance workflow around Business Case sign-off (that belongs with Phase 8's approval workflow pattern, or Phase 11/12's sign-off mechanisms, if ever extended here) — this sprint only builds the documents themselves.
Hard dependency: None from prior phases for the core entities — this is genuinely standalone data. Optional soft dependency on Cost Core (Sprint 5) if an early cost estimate already exists and should be referenced.

2. User Stories
As a Project Manager, I want to write a Business Case before a project is formally set up, so that I can justify why the project should happen before committing resources to full planning.
As a Project Manager, I want to optionally attach a Feasibility Study, so that technical, financial, and operational viability is documented for projects where that matters.
As a Project Manager, I want my Business Case to link to the real project once it's approved and created, so that the justification isn't lost or disconnected from the work that follows.

3. Functional Requirements
3.1 Business Case
New entity capturing: problem/opportunity statement, proposed solution summary, estimated cost, estimated benefit/ROI, and recommendation — each as its own field, not one undifferentiated text block.
Can exist independently of a project record (a Business Case is often written before a project is greenlit).
Optional link to a Cost Core cost estimate if one already exists at the time of writing, without requiring one.
Once approved, can be linked to a newly created (or existing) project record — this link should be additive, never destructive to either side's existing data.
3.2 Feasibility Study
New entity capturing technical, financial, and operational viability as three distinct structured free-text sections, plus an overall feasibility recommendation.
Explicitly optional — creating a project must never require one, and skipping it must not block anything else.
Can optionally link to a Business Case (a feasibility study often follows from and supports a business case) or stand alone.
3.3 Documentation Engine Integration
Both become new document_type values, using Sprint 12's templating engine.
Given both documents blend narrative judgment with limited structured data, expect a higher proportion of free-text sections than any document type built so far — this is expected and correct for this document type, not a sign the templating engine is being misused.

4. Acceptance Criteria
A Business Case can be created with no project record existing yet, and later linked to a project once one is created, with no data loss.
A Feasibility Study can be created standalone or linked to a Business Case, and skipping it entirely has zero effect on project creation or any other platform feature.
Both render and export correctly through Documentation Engine's existing pipeline (PDF, Word).

5. Non-Functional & Security Requirements
Requirement
Detail
Data Model Independence
Business Case and Feasibility Study must be capable of existing with project_id = null, linked later — this is a real schema requirement, not just a UI convenience.
Data Isolation
Both are scoped to the organization/workspace (via the creating user), consistent RLS pattern applied even before a project link exists.
Non-Blocking
Neither document may become a required gate for any other platform action — both are genuinely optional.


6. Implementation Task Breakdown: Sprint 37
[Phase 1: Schema] ──> [Phase 2: Business Case] ──> [Phase 3: Feasibility Study] ──> [Phase 4: Project Linkage]

Phase 1: Schema
[ ] Task 1.1: Design public.business_cases (id, organization_id, project_id [nullable], problem_statement, proposed_solution, estimated_cost, estimated_benefit, recommendation, linked_cost_estimate_id [nullable]).
[ ] Task 1.2: Design public.feasibility_studies (id, organization_id, project_id [nullable], business_case_id [nullable], technical_assessment, financial_assessment, operational_assessment, overall_recommendation).
Phase 2: Business Case
[ ] Task 2.1: Build the Business Case entry form and detail view.
[ ] Task 2.2: Define the document_type = 'business_case' template and resolver in Documentation Engine.
Phase 3: Feasibility Study
[ ] Task 3.1: Build the Feasibility Study entry form, supporting optional linkage to a Business Case.
[ ] Task 3.2: Define the document_type = 'feasibility_study' template and resolver.
Phase 4: Project Linkage
[ ] Task 4.1: Build the "link to project" action for both entities, additive only, never overwriting existing project data.

7. Sprint Delivery Milestones
Milestone 1 — Schema Live (Target: Day 2) Both tables deployed, correctly supporting project_id = null.
Milestone 2 — Business Case Working (Target: Day 5) Business Case can be created, edited, and rendered as a document, standalone.
Milestone 3 — Feasibility Study Working (Target: Day 7) Feasibility Study can be created, optionally linked to a Business Case, and rendered.
Milestone 4 — Linkage & Sprint Sign-Off (Target: Day 8) Both entities can be linked to a project after the fact with no data loss; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Pre-project entity ownership: if a Business Case exists before any project or organization workspace context is fully set up, who owns it — the creating user directly, or does it require at least a workspace to exist? Recommend requiring at minimum a workspace/organization context (not a bare user-level entity), consistent with the rest of the platform's data model, even though a project record itself isn't required yet.
ROI calculation rigor: should estimated benefit/ROI be a simple free-text or single number field, or a structured calculation (e.g., cost, benefit, payback period as separate computed fields)? Recommend simple structured fields (cost, benefit, resulting ratio) for this sprint, with more sophisticated ROI modeling as a future enhancement if requested.

End of Sprint 37 PRD. This is the first sprint in the platform's entire build sequence where a core entity is explicitly designed to exist without a project record — a deliberate, necessary exception to the "everything hangs off a project" pattern established since Foundation.

