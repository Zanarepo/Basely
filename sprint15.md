Product Requirements Document (PRD)
Sprint 15: Documentation Engine — Multi-Format Export & Document Management

1. Objective & Scope
The objective of Sprint 15 is to generalize export format support and document management across all four document types built in this phase (Charter, WBS Dictionary, RACI Matrix, Status Report) — built once, generically, rather than duplicated per document type.
By the end of this sprint, a Project Manager will be able to:
Export any generated document to PDF or Word (.docx)
Export the WBS Dictionary and RACI Matrix specifically to Excel (.xlsx), given their tabular structure
View a version history of exports and status report generations, and re-download a prior version without regenerating it
Out of scope for this sprint: any new document type (this sprint only adds export/management capability to the four already built) and scheduled/automatic exports (deferred to the Collaboration Layer phase).
Hard dependency: This sprint requires Sprints 12–14 to be complete, since it exports document types that must already exist. It should reuse the platform's existing document-generation approach (the same underlying skill/library pattern already used elsewhere for formatted Word/Excel output) rather than building a second, parallel export pipeline.

2. User Stories
As a Project Manager, I want to export any generated document to PDF or Word, so that I can share it with people who don't have platform access, in a format they already know how to open.
As a Project Manager, I want to export tabular documents like the WBS Dictionary to Excel, so that I can further manipulate the data if I need to.
As a Project Manager, I want to see a history of previously generated and exported documents, so that I can retrieve an old version without having to have manually saved it myself.

3. Functional Requirements
3.1 PDF Export
Available for all four document types.
Must visually and structurally match the in-app document view — same section order, same data, no degraded rendering.
3.2 Word (.docx) Export
Available for all four document types.
Reuse the platform's existing document-generation approach for formatted Word output, rather than a separate implementation specific to this phase.
3.3 Excel (.xlsx) Export
Available specifically for the WBS Dictionary and RACI Matrix, given their tabular/grid structure.
Not required for Charter or Status Report, which are prose-first documents where a spreadsheet export adds little value — this scoping decision should be treated as intentional, not an oversight, to avoid unnecessary engineering effort on a low-value format.
Excel export must preserve hierarchical/tabular structure (e.g., WBS indentation reflected as nested rows or a clear code-based sort), not flatten the data into an unreadable dump.
3.4 Document Version History
Every export action is logged: document type, format, timestamp, and a reference to the exact content exported.
Every Status Report generation (already snapshotted per Sprint 14) is included in this same history view for a unified experience across document types.
A PM can view the history for a project and re-download any prior export exactly as it was generated, without needing to regenerate it live (which, for the always-current document types, could produce different content than what was originally exported).

4. Acceptance Criteria
Every document type from this phase can be exported to every format specified above (Section 3), producing a correctly formatted, readable file — not a broken or degraded rendering of the in-app view.
Exporting a 20-work-package WBS Dictionary to Excel produces a spreadsheet with correct hierarchical/tabular structure, not a flattened, unreadable dump.
Document version history correctly retrieves a prior export exactly as it was generated, even after the underlying live data has since changed — this must hold for PDF/DOCX exports of always-current document types (Charter, WBS Dictionary, RACI), not only for Status Report snapshots.

5. Non-Functional & Security Requirements
Requirement
Detail
Export Fidelity
Exported files must be visually/structurally faithful to the in-app document view — this is the primary quality bar for this sprint.
Consistency
This sprint must reuse the platform's existing document-generation approach rather than introducing a second, inconsistent export pipeline — a second implementation is both wasted effort and a future maintenance/formatting-drift risk.
Data Isolation
document_exports inherits the same project-scoped RLS pattern established across every prior phase.
Storage
Export file storage approach (persisted files vs. regenerate-on-demand from stored snapshot data) must be resolved per Section 8 before this sprint's storage costs are locked in at scale.


6. Implementation Task Breakdown: Sprint 15
[Phase 1: Export Schema & Infrastructure] ──> [Phase 2: PDF Export] ──> [Phase 3: Word Export] ──> [Phase 4: Excel Export] ──> [Phase 5: Version History & Retrieval]

Phase 1: Export Schema & Infrastructure
Goal: Provision the shared table and pipeline every export format will use.
[x] Task 1.1: Design Export Schema


Create a SQL migration for public.document_exports (id, generated_document_id FK, format enum [pdf/docx/xlsx], exported_at, file_reference).
[x] Task 1.2: Configure Row Level Security


Enable RLS on document_exports, reusing the organization_members-scoped pattern established since Sprint 1.
[x] Task 1.3: Establish Shared Export Pipeline Pattern


Confirm and wire the reusable approach for taking a generated_documents row's resolved content and producing a formatted output file, used consistently by all three export format tasks below.
Phase 2: PDF Export
Goal: Build PDF export for all four document types using the shared pipeline.
[x] Task 2.1: Implement PDF Rendering


Render each document type's resolved content (data-bound + free-text) to a correctly formatted PDF.
[x] Task 2.2: Validate Fidelity Across All Four Document Types


Confirm PDF output visually matches the in-app view for Charter, WBS Dictionary, RACI Matrix, and Status Report.
Phase 3: Word (.docx) Export
Goal: Build Word export for all four document types.
[x] Task 3.1: Implement DOCX Rendering


Render each document type's resolved content to a correctly formatted Word document, reusing the platform's existing document-generation library/pattern.
[x] Task 3.2: Validate Fidelity Across All Four Document Types


Confirm DOCX output structure and formatting matches the in-app view.
Phase 4: Excel (.xlsx) Export
Goal: Build Excel export specifically for the two tabular document types.
[x] Task 4.1: Implement XLSX Rendering for WBS Dictionary


Render the hierarchical WBS data into a structured spreadsheet, preserving code-based ordering and indentation cues.
[x] Task 4.2: Implement XLSX Rendering for RACI Matrix


Render the assignment grid into a spreadsheet with work packages and stakeholders as rows/columns.
Phase 5: Version History & Retrieval
Goal: Give PMs a unified way to browse and retrieve everything they've exported or generated.
[x] Task 5.1: Build Export Logging


Log every export action to document_exports with the format and a reference to the exact content exported.
[x] Task 5.2: Build Unified History View


A single view combining export history (this sprint) and Status Report generation history (Sprint 14) for a project.
[x] Task 5.3: Implement Exact-Content Retrieval


Ensure re-downloading a prior export returns the file as it was at export time, not a freshly regenerated (and potentially now-different) version — resolve per Section 8's storage decision.

7. Sprint Delivery Milestones
Milestone 1 — Export Infrastructure Live (Target: Day 3) document_exports table deployed with RLS confirmed; shared export pipeline pattern established and validated with a minimal end-to-end test.
Milestone 2 — PDF & Word Export Working (Target: Day 7) All four document types export correctly to both PDF and DOCX, verified for fidelity against the in-app view.
Milestone 3 — Excel Export Working (Target: Day 9) WBS Dictionary and RACI Matrix export correctly to Excel with preserved hierarchical/tabular structure.
Milestone 4 — Version History & Sprint Sign-Off (Target: Day 12) Unified history view and exact-content retrieval both work correctly across all document types and formats; all Section 4 acceptance criteria pass — this milestone closes out the entire Documentation Engine phase.

8. Open Questions Carried Into This Sprint
Export file storage approach: should exported PDF/DOCX/XLSX files be persisted as actual files (simpler exact-retrieval, higher storage cost at scale) or regenerated on-demand from stored snapshot/live data at retrieval time (lower storage cost, but requires the underlying rendering to be perfectly deterministic to guarantee exact-content retrieval)? This must be resolved before Task 5.3, since it fundamentally changes that task's implementation approach.
Regeneration-vs-retrieval consistency for always-current documents: for Charter/WBS Dictionary/RACI (which are always-current, unlike Status Reports), does "retrieve a prior export" mean the exact file as originally rendered, or a fresh render using the export's original timestamp as a point-in-time filter? The former requires file persistence; the latter requires those document types to support historical point-in-time queries they don't currently have (Sprint 12/13 only guarantee current-state accuracy). Recommend requiring file persistence for these document types specifically, to avoid retroactively expanding their scope.
Export retention policy: should exported files/history be retained indefinitely, or is there a retention window (e.g., last 12 months, or last N exports per document type) appropriate for cost control? Worth a product decision before this becomes a real storage cost concern at scale, rather than after.

End of Sprint 15 PRD. This sprint completes the Documentation Engine phase (Charter → WBS Dictionary/RACI → Status Report → Multi-Format Export). Every document type a PM would otherwise have manually assembled — the exact problem identified in this platform's original market research — is now auto-generated, always current (or correctly historical where that matters), and exportable in the formats stakeholders actually expect. The next phase in the platform's build sequence is the Collaboration Layer: comments, notifications, and activity log.

