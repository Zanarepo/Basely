Product Requirements Document (PRD)
Sprint 9: Accountability Layer — Stakeholder Register

1. Objective & Scope
The objective of Sprint 9 is to build the stakeholder register — the structured list of everyone involved in a project, internal or external, that Sprint 10 (RACI Matrix) and Sprint 11 (Risk & Issue Register) will both depend on as their single source of truth for "who."
By the end of this sprint, a Project Manager will be able to:
Build a register of stakeholders for a project, distinguishing internal team members from external clients/vendors
Record each stakeholder's influence, interest, and communication preferences
Link an internal stakeholder to an existing platform user account, while still supporting external stakeholders who will never log in
Out of scope for this sprint: RACI role assignment (Sprint 10) and risk/issue ownership (Sprint 11) — this sprint only builds the register itself, not what gets assigned to the people in it.
Hard dependency: This sprint requires Foundation (Sprint 1) for organization_members/profiles, since internal stakeholders can optionally link to an existing platform user account. It does not depend on Planning Core or Cost Core — the stakeholder register is independent of WBS/schedule/budget data.

2. User Stories
As a Project Manager, I want to maintain a register of everyone involved in my project, so that I have one place to track who's who instead of it living in my head or a separate spreadsheet.
As a Project Manager, I want to record each stakeholder's influence and interest level, so that I can tailor how much and how often I communicate with them.
As a Project Manager, I want to distinguish internal team members from external stakeholders, so that visibility and communication rules can differ appropriately between the two.
As a Project Manager, I want to link a stakeholder to their platform account when they have one, so that I'm not maintaining duplicate, potentially inconsistent records of the same person.

3. Functional Requirements
3.1 Stakeholder Record
Capture the following fields per stakeholder:
Name
Role/title
Organization type: internal or external (client, vendor, regulator, etc. — a free-text sub-category alongside the internal/external flag)
Contact information: email, phone
Influence level (e.g., low/medium/high, or a numeric scale — see Section 8)
Interest level (same scale as influence)
Preferred communication method and frequency (free text or structured — see Section 8)
3.2 Platform User Linkage
An internal stakeholder may optionally be linked to an existing platform user account (profiles/organization_members from Foundation).
A linked stakeholder's name/email should stay synced with the underlying account — if the account's name is updated, the stakeholder record reflects it rather than drifting into an inconsistent duplicate.
An external stakeholder has no platform account and exists as a register entry only; the schema must support this without forcing a null-user workaround that looks like an error state.
3.3 CRUD Interface
Create, edit, and remove stakeholders directly from a project's stakeholder register view.
Support bulk actions where reasonable (e.g., removing multiple stakeholders at once) — full bulk import/export is not required this sprint but should not be architecturally blocked.
3.4 Reusability Scope
Support stakeholder management at the level decided in Section 8 (project-only vs. workspace-level shared register) — this decision must be made before schema finalization since it affects the table's primary scoping key.

4. Acceptance Criteria
A PM can build a stakeholder register of 15+ people for a project, correctly distinguishing internal vs. external, in under 10 minutes.
An internal stakeholder linked to a platform user account stays correctly associated even if that user's name/email is later updated at the account level — no manual re-sync required.
An external stakeholder can be fully created, edited, and removed without ever touching or requiring a platform user account.
The stakeholder register is queryable in a way Sprint 10 can consume directly (a stable list of stakeholder_ids per project) with no data duplication.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
stakeholders must inherit the same project-scoped (or workspace-scoped, per Section 8's decision) RLS pattern established across every prior phase.
Data Integrity
linked_user_id must be nullable and must never be required for a stakeholder record to be valid — external stakeholders are a first-class case, not an edge case.
Consistency
A linked stakeholder's displayed name/email must always reflect the current state of the underlying user account, not a stale copy captured at link time.
Extensibility
Schema must not block Sprint 10 (RACI assignments) or Sprint 11 (risk/issue ownership) from referencing stakeholder_id as a foreign key without a breaking migration.


6. Implementation Task Breakdown: Sprint 9
[Phase 1: Stakeholder Schema & RLS] ──> [Phase 2: CRUD Interface] ──> [Phase 3: Platform User Linkage] ──> [Phase 4: Register View & Filtering]

Phase 1: Stakeholder Schema & Row Level Security
Goal: Provision the table that holds stakeholder data, correctly scoped per the Section 8 reusability decision.
[ ] Task 1.1: Design Stakeholder Schema


Create a SQL migration for public.stakeholders (id, project_id [or organization_id, per Section 8], name, role_title, organization_type enum [internal/external], sub_category, email, phone, influence, interest, communication_preference, linked_user_id [nullable FK → profiles]).
[ ] Task 1.2: Configure Row Level Security


Enable RLS on stakeholders, reusing the organization_members-scoped pattern established since Sprint 1.
Restrict write access to Admin/PM roles; broader read access is likely appropriate here since stakeholder visibility is generally less sensitive than budget data (confirm with the same product-level review used for Sprint 5's budget visibility decision).
Phase 2: CRUD Interface
Goal: Let a PM build and maintain the register quickly.
[ ] Task 2.1: Build Stakeholder Create/Edit Form


Form capturing all fields from Section 3.1, with sensible defaults (e.g., influence/interest defaulting to "medium" rather than blank).
[ ] Task 2.2: Build Stakeholder List/Register View


A table or card view listing all stakeholders for a project, with columns/filters for organization type, influence, and interest.
[ ] Task 2.3: Support Bulk Removal


Multi-select and bulk-delete stakeholders from the register view.
Phase 3: Platform User Linkage
Goal: Connect internal stakeholders to real accounts without forcing it, and keep linked data in sync.
[ ] Task 3.1: Build User-Linking UI


When creating/editing an internal stakeholder, allow searching and linking to an existing organization_members user.
[ ] Task 3.2: Implement Sync Behavior


Ensure the stakeholder record's displayed name/email reflects the linked user's current data (via a live join/read, not a copied snapshot) rather than needing manual re-entry after an account update.
[ ] Task 3.3: Handle Unlinking


Support unlinking a stakeholder from a user account (e.g., someone left the organization but the historical stakeholder record should remain), converting them cleanly to an unlinked/external-style record without data loss.
Phase 4: Register View & Filtering
Goal: Make the register genuinely useful to browse and communicate from, not just a raw data table.
[ ] Task 4.1: Build Influence/Interest Filtering


Allow filtering or grouping the register view by influence and interest level (common PM technique: a 2×2 influence/interest grid for communication planning).
[ ] Task 4.2: Build Internal/External Toggle View


Quick filter to view only internal or only external stakeholders.

7. Sprint Delivery Milestones
Milestone 1 — Stakeholder Data Layer Live (Target: Day 2) stakeholders table deployed with RLS confirmed; supports both linked and unlinked (external) records cleanly.
Milestone 2 — CRUD Working (Target: Day 4) PMs can create, edit, and remove stakeholders through the register view, with all Section 3.1 fields captured correctly.
Milestone 3 — User Linkage & Sync Working (Target: Day 6) Internal stakeholders can be linked to platform accounts; linked data stays in sync with the underlying account without manual re-entry; unlinking works cleanly.
Milestone 4 — Register View & Sprint Sign-Off (Target: Day 7) Influence/interest filtering and internal/external views work correctly; the 15-stakeholder, under-10-minute acceptance criterion passes in usability testing.
(This sprint is intentionally shorter than the Planning Core and Cost Core sprints — the stakeholder register is comparatively low-complexity and doesn't carry a calculation-engine risk profile like the CPM or EVM sprints.)

8. Open Questions Carried Into This Sprint
Reusability scope: should stakeholders be scoped strictly per-project, or shared at the workspace/organization level so a recurring client contact doesn't need to be re-entered on every new project? This must be decided before Task 1.1, since it determines whether stakeholders keys off project_id or organization_id — changing this later is a breaking migration, not a simple toggle.
Influence/interest scale: should this be a simple low/medium/high enum, or a numeric scale (e.g., 1–5) that supports more granular sorting and future 2×2 grid visualizations? A numeric scale is more flexible for later reporting but slightly more UI friction for quick entry.
Communication preference structure: should this be free text (fast to ship, flexible) or a structured field (method: email/phone/meeting; frequency: weekly/biweekly/monthly)? Structured data is more useful if a future phase wants to automate communication reminders, but adds scope now.
Default visibility: confirm the RLS read-access default from Task 1.2 — is stakeholder data visible to all project roles (Team Member, Viewer) by default, or restricted like budget data? Recommend broader visibility by default unless there's a specific reason (e.g., a sensitive external negotiation) to restrict it.

End of Sprint 9 PRD. This sprint builds the "who" that Sprint 10 (RACI Matrix) assigns roles to and Sprint 11 (Risk & Issue Register) assigns ownership to. Neither of those sprints can meaningfully begin without this register in place.

