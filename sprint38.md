Product Requirements Document (PRD)
Sprint 38: Document Library — Scope Statement/SOW & Communication Plan

1. Objective & Scope
The objective of Sprint 38 is to build the two remaining Planning-stage documents that capture scope boundaries and stakeholder communication cadence as first-class artifacts, rather than leaving them implicit in the WBS and stakeholder register.
By the end of this sprint, a Project Manager will be able to:
Document explicit scope boundaries (in-scope, out-of-scope, assumptions, constraints), optionally anchored to specific WBS elements
Build a Communication Plan mapping which stakeholder groups receive which document types, at what cadence, via what channel
Out of scope for this sprint: any enforcement mechanism preventing scope creep (this is a documentation artifact, not a scope-change gate — that's Sprint 41's Change Request Log) and any automated delivery of documents per the Communication Plan (that's a future Collaboration Layer fast-follow, once scheduled delivery infrastructure exists).
Hard dependency: This sprint requires Planning Core's Sprint 2 (WBS) for the Scope Statement's optional anchoring, and Accountability Layer's Sprint 9 (stakeholder communication preferences) as the Communication Plan's starting data.

2. User Stories
As a Project Manager, I want to document what's explicitly in and out of scope, so that scope boundaries are written down rather than assumed or argued about later.
As a Project Manager, I want to build a communication plan mapping who gets which reports and how often, so that stakeholder communication is deliberate rather than ad hoc.

3. Functional Requirements
3.1 Scope Statement / SOW
New entity capturing: in-scope summary, out-of-scope exclusions, assumptions, and constraints — as distinct, structured free-text sections.
Optionally references specific top-level WBS elements as the "in scope" anchor, so the statement connects to the WBS a PM already built rather than existing in complete isolation.
3.2 Communication Plan
Aggregates the per-stakeholder communication_preference field already captured in Sprint 9 as a starting point.
Extends this into a genuine plan: a structured table mapping stakeholder groups (or individual stakeholders) → which document types they receive (Status Reports, Closure Reports, etc.) → cadence → channel.
Must read the available document-type list dynamically from Documentation Engine's registered document_type values, not a hardcoded list — this is the fix for the exact kind of staleness gap that created the need for Sprint 36's fast-follow in the first place.
3.3 Documentation Engine Integration
Both become new document_type values using the existing Sprint 12 templating structure.

4. Acceptance Criteria
A Scope Statement can be created referencing specific WBS elements as its in-scope anchor, with out-of-scope/assumptions/constraints as clearly separated sections.
A Communication Plan correctly pre-populates from existing per-stakeholder communication preferences, and supports mapping specific document types to specific stakeholder groups and cadences.
Adding a new document type to Documentation Engine in a future phase (verified with a test addition) automatically becomes available for mapping in the Communication Plan, with zero code change required in this sprint's own feature.

5. Non-Functional & Security Requirements
Requirement
Detail
Extensibility
The Communication Plan's document-type list must be sourced dynamically from Documentation Engine's registry — this is the single most important design decision in this sprint, given the precedent set by Sprint 36's fast-follow.
Consistency
Reuses Documentation Engine's existing rendering pipeline.
Data Isolation
Scoped to the project, consistent with every other Documentation Engine document.


6. Implementation Task Breakdown: Sprint 38
[Phase 1: Scope Statement Schema & Template] ──> [Phase 2: Communication Plan Schema] ──> [Phase 3: Dynamic Document-Type Registry Read] ──> [Phase 4: Communication Plan Template]

Phase 1: Scope Statement Schema & Template
[ ] Task 1.1: Design public.scope_statements (id, project_id, in_scope_summary, out_of_scope, assumptions, constraints, anchored_wbs_element_ids [array, nullable]).
[ ] Task 1.2: Define document_type = 'scope_statement' template using Sprint 12's schema.
Phase 2: Communication Plan Schema
[ ] Task 2.1: Design public.communication_plan_entries (id, project_id, stakeholder_id_or_group, document_type, cadence, channel).
Phase 3: Dynamic Document-Type Registry Read
[ ] Task 3.1: Build the query/interface that reads currently-available document_type values from Documentation Engine's registry at Communication Plan edit-time, rather than a hardcoded enum.
Phase 4: Communication Plan Template
[ ] Task 4.1: Define document_type = 'communication_plan' template and build the pre-population logic from Sprint 9's stakeholder communication preferences.

7. Sprint Delivery Milestones
Milestone 1 — Scope Statement Working (Target: Day 3) Schema and template deployed; a Scope Statement can be created and optionally anchored to WBS elements.
Milestone 2 — Communication Plan Schema & Pre-Population (Target: Day 6) Communication Plan entries can be created, pre-populated from Sprint 9 data.
Milestone 3 — Dynamic Registry Read Working (Target: Day 8) A test document-type addition is confirmed to automatically appear as a mappable option in the Communication Plan, with no code change to this sprint's own feature.
Milestone 4 — Sprint Sign-Off (Target: Day 9) All Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Stakeholder groups vs. individuals: should the Communication Plan support mapping to a defined "group" (e.g., "Steering Committee") in addition to individual stakeholders, or is individual-only sufficient for launch? Recommend individual-only for this sprint, with grouping as a natural enhancement once real usage shows the need — avoids inventing a "stakeholder group" concept that doesn't exist anywhere else in the platform yet.
WBS anchor scope: should the Scope Statement's WBS anchoring be limited to top-level elements only, or any level of the hierarchy? Recommend top-level only for readability — anchoring to every possible WBS depth would make the in-scope summary unwieldy to review.

End of Sprint 38 PRD. Phase 3's dynamic registry read is the most important technical decision in this sprint — it's the direct fix for the exact failure mode (a deferred promise silently going stale) that created Sprint 36's need to exist in the first place.

