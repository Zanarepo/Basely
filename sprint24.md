Product Requirements Document (PRD)
Sprint 24: Administration & Governance — Custom Templates

1. Objective & Scope
The objective of Sprint 24 is to build custom document template support, letting enterprise organizations define their own section structure for the Charter and Status Report document types built in Documentation Engine, rather than being limited to the platform's fixed default templates.
By the end of this sprint, an organization admin will be able to:
Define a custom template for Charter or Status Report with their own section structure
Have PMs choose between the default template and any organization-defined custom templates when generating a document
Trust that introducing custom templates causes zero change to existing default-template behavior for any organization that doesn't use this feature
Out of scope for this sprint: custom templates for WBS Dictionary or RACI Matrix (explicitly deferred per the parent Phase 8 PRD, since those tabular documents have less need for structural customization) and a full drag-and-drop template builder UI (this sprint's template definition can be a structured form, not necessarily a visual builder — see Section 8).
Hard dependency: This sprint builds directly on Documentation Engine's Sprint 12 templating engine — it must reuse the exact same section_definitions JSON shape, not invent a second template format. This sprint should require no changes to Sprint 12's rendering engine itself, only new template definitions and a selection mechanism.

2. User Stories
As an Enterprise PMO Director, I want to define our organization's own status report template, so that generated reports match our existing internal reporting standards rather than a generic default.
As a Project Manager, I want to select from my organization's approved templates when generating a document, so that I'm not stuck manually reformatting the default output to match what my organization expects.

3. Functional Requirements
3.1 Custom Template Definition
An organization admin can define a custom template for Charter or Status Report, specifying:
Section structure (which sections exist, in what order)
Section labels (custom naming, e.g., "Executive Summary" instead of "Narrative Summary")
Which data-bound fields appear in each section, drawing only from fields already exposed by Documentation Engine's existing resolvers (Sprint 12/14) — this sprint does not introduce new data-bound field types.
Template definition uses the same section_definitions JSON shape already established in Documentation Engine's DocumentTemplate (Sprint 12), stored instead in a new CustomDocumentTemplate table scoped to the organization.
3.2 Template Selection
When generating a Charter or Status Report, a PM can choose between:
The platform default template
Any custom template their organization has defined for that document type
The selected template determines the generated document's structure; regeneration of an existing document should remember which template was originally used.
3.3 Organization Scoping
Custom templates are visible and usable only within the organization that created them — no cross-organization sharing or visibility.
3.4 Backward Compatibility
Introducing this sprint's feature must not alter the default template's behavior in any way for organizations that never create a custom template — the default remains exactly as Documentation Engine originally built it.

4. Acceptance Criteria
An organization admin can define a custom Status Report template with a different section structure and different section labels than the default, and that custom template renders correctly when selected.
A PM generating a document can choose between the default and any custom templates available to their organization, with the correct template's structure reflected in the generated output.
Documents generated using the default template continue to render exactly as they did before this sprint shipped, confirmed via a direct before/after comparison — zero regression to Documentation Engine's existing behavior.
A custom template defined by one organization is not visible or selectable by any other organization.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
custom_document_templates is strictly organization-scoped; cross-organization visibility of a custom template is a defect, not a minor issue.
Backward Compatibility
This is the sprint's most important guarantee — the default template path used by every non-enterprise customer must be provably unchanged.
Consistency
Custom templates must reuse Documentation Engine's existing rendering engine exactly — this sprint should not introduce a second, parallel rendering pipeline for custom vs. default templates.
Security
Custom template configuration must be restricted to organization Admin role only.


6. Implementation Task Breakdown: Sprint 24
[Phase 1: Custom Template Schema & RLS] ──> [Phase 2: Template Definition UI] ──> [Phase 3: Template Selection & Rendering] ──> [Phase 4: Regression Validation]
Phase 1: Custom Template Schema & Row Level Security
Goal: Provision the table, reusing Sprint 12's existing template shape exactly.
Task 1.1: Design Custom Template Schema
Create a SQL migration for public.custom_document_templates (id, organization_id, document_type enum [charter/status_report], section_definitions [JSON, same shape as Documentation Engine's DocumentTemplate.section_definitions]).
Task 1.2: Configure Row Level Security
Restrict write access to organization Admin role; restrict read/selection access to users within the organization only.
Phase 2: Template Definition UI
Goal: Let an admin define a custom template without needing engineering involvement per organization.
Task 2.1: Build Template Definition Form
A structured form (not necessarily a visual drag-and-drop builder — see Section 8) for defining section order, labels, and selecting available data-bound fields per section.
Task 2.2: Build Template Preview
Allow an admin to preview how a custom template will render before saving it, using sample/placeholder data if a real project isn't convenient to preview against.
Phase 3: Template Selection & Rendering
Goal: Wire custom templates into the existing generation flow.
Task 3.1: Build Template Selector
Add a template choice step to the document generation flow (Charter/Status Report), listing the default plus any organization-defined custom templates.
Task 3.2: Wire Custom Templates into Sprint 12's Rendering Engine
Ensure custom section_definitions are rendered by the exact same engine used for default templates — no separate rendering code path.
Task 3.3: Persist Template Choice on Generated Documents
Ensure a GeneratedDocument row records which template (default or specific custom template) was used, so regeneration uses the same one consistently.
Phase 4: Regression Validation
Goal: Prove this sprint didn't quietly break anything that already worked.
Task 4.1: Run Full Default-Template Regression Suite
Re-run Documentation Engine's Sprint 12/14 acceptance criteria against the default template path, post-Sprint-24, confirming zero behavioral change.

7. Sprint Delivery Milestones
Milestone 1 — Custom Template Schema Live (Target: Day 2) custom_document_templates table deployed with RLS confirmed, using the exact section_definitions shape from Sprint 12.
Milestone 2 — Template Definition Working (Target: Day 5) Admins can define and preview a custom Charter or Status Report template.
Milestone 3 — Selection & Rendering Working (Target: Day 7) PMs can select between default and custom templates when generating documents, with correct rendering via the shared Sprint 12 engine.
Milestone 4 — Regression Validated & Sprint Sign-Off (Target: Day 8) Full default-template regression suite passes with zero deviation; all Section 4 acceptance criteria pass — this milestone closes out the entire Administration & Governance phase.

8. Open Questions Carried Into This Sprint
Template definition UX: is a structured form (list of sections with dropdowns/text fields) sufficient for this sprint, or is a visual drag-and-drop builder expected at launch? A structured form is meaningfully faster to build and may be entirely adequate for an admin-configured, infrequently-changed template — recommend structured form for this sprint, with a visual builder as a clear future enhancement if user feedback indicates real need.
Data-bound field restrictions: should custom templates be able to include any data-bound field Documentation Engine exposes, or should certain fields be restricted from custom templates for some reason (unlikely, but worth a quick sanity check)? Recommend no restrictions beyond what's already exposed — this sprint is purely about reordering/relabeling existing fields, not exposing new data.
Multiple custom templates per document type: can an organization define more than one custom Status Report template (e.g., one for internal use, one for client-facing use), or exactly one custom template per document type? Recommend allowing multiple, since the schema (one row per template) already supports it naturally without added complexity.
Deleting a custom template in use: if a custom template is deleted after documents were already generated with it, what happens to those existing GeneratedDocument records referencing it? Recommend preventing deletion of a template that's been used at least once, or soft-deleting it so historical documents remain resolvable, rather than allowing a hard delete that could break existing document references.

End of Sprint 24 PRD. This sprint completes the Administration & Governance phase (SSO → Approval Workflows → Audit Logs → Custom Templates) and, with it, the entire enterprise-readiness feature set originally scoped in the master PRD. The final remaining build-sequence item is Integrations: calendar sync, file storage, ERP export, and a public API.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 