Product Requirements Document (PRD)
Sprint 18: Collaboration Layer — Activity Log & File Attachments

1. Objective & Scope
The objective of Sprint 18 is to build the project-level activity/audit log and file attachment support — two lower-complexity, cross-cutting features that close out the Collaboration Layer phase, benefiting from having comments (Sprint 16) and notifications (Sprint 17) already in place to log and (in future work) notify on.
By the end of this sprint, a user will be able to:
See a chronological, filterable feed of meaningful project events
Trust that sensitive changes (baseline saves, RACI reassignments) are captured with proper audit detail
Attach files directly to schedule activities and WBS deliverables
Out of scope for this sprint: any new document/entity type beyond what's already established, and automated cleanup/retention policies for old log entries or attachments (a later operational concern, not core to this sprint).
Hard dependency: This sprint reuses the entity_type/entity_id polymorphic pattern established in Sprint 16 for file attachments, and logs events already being generated across every prior phase (baseline saves from Sprints 3/5, RACI reassignments from Sprint 10, risk status changes from Sprint 11, comments from Sprint 16).

2. User Stories
As a Project Manager, I want a single activity log showing meaningful changes across my project, so that I can see "what happened while I was out" without having to ask around.
As an Enterprise PMO Director, I want an audit trail of changes to baselines, budgets, and approvals, so that I have accountability and traceability for compliance purposes.
As a Team Member, I want to attach files directly to a task or deliverable, so that supporting materials live next to the work instead of in a disconnected email thread.

3. Functional Requirements
3.1 Activity Log
A project-level, chronological feed capturing meaningful events, at minimum:
Schedule baseline saves (Sprint 3)
Budget baseline saves (Sprint 5)
RACI reassignments (Sprint 10)
Risk status changes (Sprint 11)
Comments posted (Sprint 16)
Documents generated (Documentation Engine)
Files attached (this sprint)
Not every field-level edit is logged — the log captures meaningful state changes, not raw database writes, to avoid becoming unusable noise.
Each entry records: event type, acting user, timestamp, and a reference to the specific affected entity.
3.2 Audit Trail for Sensitive Changes
Baseline saves (schedule and budget) specifically must be logged with enough who/what/when detail to satisfy the master PRD's auditability requirement — this is a stronger guarantee than general activity logging, since baselines are financially/contractually significant records.
This audit-grade logging must be structurally guaranteed (e.g., triggered automatically by the baseline-save operation itself), not dependent on a developer remembering to add a log call at each new baseline-related feature.
3.3 Activity Log Filtering
Support filtering the log by event type and date range, so it remains usable on a project with a long history rather than becoming an unreadable, unfiltered feed.
3.4 File Attachments
Support attaching files to:
Schedule activities (Planning Core)
WBS work packages, as a reference to their deliverables (Planning Core)
Basic file operations per entity: upload, list, download, delete.
Attachment storage reuses the platform's existing file storage infrastructure/pattern rather than introducing a new storage mechanism specific to this sprint.

4. Acceptance Criteria
The activity log for a project correctly captures at minimum the event types listed in Section 3.1, verified against a test project exercising each of those actions.
A budget baseline save appears in the log with the acting user, timestamp, and a reference to the specific baseline created, satisfying the audit-trail requirement.
A user can attach a file to a schedule activity and to a WBS work package, and retrieve it later from that entity's detail view.
The activity log is filterable by event type and date range, verified as remaining responsive on a project with a substantial (1,000+) event history.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
activity_log_entries and attachments inherit the same project-scoped RLS pattern established across every prior phase.
Auditability
Baseline-save logging must be structurally guaranteed at the point of the save operation, not dependent on scattered manual logging calls across the codebase — this is a hard requirement carried forward from the master PRD's Section 6.
Performance
Activity log filtering/pagination must remain fast (sub-second) on projects with thousands of logged events.
Extensibility
attachments must use the same entity_type/entity_id polymorphic pattern established for comments in Sprint 16, so a future attachable entity type doesn't require a new table or schema redesign.
Storage Hygiene
File uploads must enforce a reasonable size cap and restrict potentially unsafe file types (e.g., executables), per the decision reached in Section 8.


6. Implementation Task Breakdown: Sprint 18
[Phase 1: Activity Log Schema & RLS] ──> [Phase 2: Event Logging Wiring] ──> [Phase 3: Log View & Filtering] ──> [Phase 4: Attachment Schema & Storage] ──> [Phase 5: Attachment UI]

Phase 1: Activity Log Schema & Row Level Security
Goal: Provision the table that holds activity log entries.
[ ] Task 1.1: Design Activity Log Schema


Create a SQL migration for public.activity_log_entries (id, project_id, event_type, actor_user_id, reference_entity_type, reference_entity_id, detail [JSON], created_at).
[ ] Task 1.2: Configure Row Level Security


Enable RLS on activity_log_entries, reusing the organization_members-scoped pattern established since Sprint 1.
Phase 2: Event Logging Wiring
Goal: Connect every event type from Section 3.1 to the activity log, with baseline saves given special structural guarantees.
[ ] Task 2.1: Wire Baseline Save Logging


Add automatic activity-log entry creation directly within the schedule baseline save (Sprint 3) and budget baseline save (Sprint 5) operations, ensuring this can't be bypassed by any code path that saves a baseline.
[ ] Task 2.2: Wire RACI, Risk, Comment, and Document Event Logging


Add activity-log entry creation for RACI reassignments (Sprint 10), risk status changes (Sprint 11), comments posted (Sprint 16), and documents generated (Documentation Engine).
[ ] Task 2.3: Finalize the Full Loggable Event List


Cross-check the final list of event types against the Phase 6 PRD's Section 6.4 open question, confirming completeness before this phase is marked done.
Phase 3: Log View & Filtering
Goal: Make the log genuinely usable, not just a raw data table.
[ ] Task 3.1: Build Activity Log View


Chronological feed UI showing event type, actor, timestamp, and a link to the affected entity.
[ ] Task 3.2: Implement Filtering


Filter controls for event type and date range.
Phase 4: Attachment Schema & Storage
Goal: Provision the attachment data model and connect it to existing storage infrastructure.
[ ] Task 4.1: Design Attachment Schema


Create a SQL migration for public.attachments (id, entity_type enum [activity/wbs_element], entity_id, file_reference, uploaded_by_user_id, uploaded_at), using the same polymorphic pattern as Sprint 16's comments.
[ ] Task 4.2: Configure Row Level Security


Enable RLS on attachments, deriving visibility from the referenced entity, consistent with Sprint 16's comment-permission approach.
[ ] Task 4.3: Connect to Existing File Storage


Wire upload/download to the platform's existing file storage infrastructure (the same underlying mechanism used elsewhere for file handling), rather than building a new storage integration specific to this sprint.
Phase 5: Attachment UI
Goal: Let users attach and retrieve files directly from the entities they relate to.
[ ] Task 5.1: Build Attachment Upload/List UI


Component for uploading, listing, downloading, and deleting attachments, embedded in the activity detail view and WBS work package detail view.
[ ] Task 5.2: Enforce Size/Type Restrictions


Implement the size cap and file-type restrictions decided in Section 8.

7. Sprint Delivery Milestones
Milestone 1 — Activity Log Schema Live (Target: Day 2) activity_log_entries table deployed with RLS confirmed.
Milestone 2 — Event Logging Wired (Target: Day 5) All Section 3.1 event types correctly generate log entries, with baseline-save logging structurally guaranteed at the operation level, not just added as an afterthought call.
Milestone 3 — Log View & Filtering Working (Target: Day 7) Activity log view renders correctly and remains responsive with filtering on a project with substantial event history.
Milestone 4 — Attachments & Sprint Sign-Off (Target: Day 9) File attachments work correctly on both activities and WBS work packages, with size/type restrictions enforced; all Section 4 acceptance criteria pass — this milestone closes out the entire Collaboration Layer phase.

8. Open Questions Carried Into This Sprint
Final loggable event list: Task 2.3 requires cross-checking the complete list of event types across every prior phase — should this include lower-level events like individual WBS element renames, or stay scoped to the higher-level events listed in Section 3.1? Recommend starting scoped to Section 3.1's list and treating "should X also be logged" as an easy additive change later, rather than over-logging from day one and creating noise.
File size and type restrictions: what's a reasonable per-file size cap (e.g., 25MB, 100MB), and which file types should be restricted for security hygiene (executables at minimum; possibly also restricting certain script/macro-enabled document types)? Needs a concrete decision before Task 5.2.
Attachment storage cost/retention: should there be any limit on total attachment storage per project/workspace, or is this purely pay-as-you-grow? Not urgent to resolve before this sprint ships, but worth flagging for whoever owns infrastructure cost planning.
Cross-linking attachments and comments: should it be possible to attach a file directly within a comment (not just at the entity level), or are entity-level attachments (this sprint's scope) sufficient for launch? Recommend entity-level only for this sprint, with comment-level attachments as a natural future enhancement once both systems are proven out independently.

End of Sprint 18 PRD. This sprint completes the Collaboration Layer phase (Comments & Mentions → Notifications → Activity Log & File Attachments). The platform now has full visibility into what happened, who did it, and supporting materials attached directly to the work — closing the loop that started with "system of record" and ends with "system people actually work through." The next phase in the platform's build sequence is Reporting & Dashboards, which will be the first phase to meaningfully surface this phase's activity log and notification data into visual, at-a-glance views.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

