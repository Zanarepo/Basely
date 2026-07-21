Product Requirements Document (PRD)
Sprint 16: Collaboration Layer — Comments & Mentions

1. Objective & Scope
The objective of Sprint 16 is to build threaded comments and @mentions on the three entity types most likely to need in-context discussion — schedule activities, generated documents, and risks — establishing a generic commenting pattern the platform can extend to other entity types later without a schema redesign.
By the end of this sprint, a user will be able to:
Post, edit, and delete comments on a schedule activity, a document, or a risk
@mention a specific stakeholder or platform user in a comment
Trust that the underlying comment model will extend cleanly to future entity types (issues, WBS elements, etc.) without requiring a migration
Out of scope for this sprint: notification delivery for mentions (Sprint 17 — this sprint only creates the mention record, not the alert), and file attachments (Sprint 18).
Hard dependency: This sprint requires Planning Core (Sprint 3, for activities), Documentation Engine (Sprint 12, for documents), and Accountability Layer (Sprint 11, for risks) to be complete, since those are the three entity types this sprint makes commentable. It also requires Sprint 9's stakeholder register for @mention resolution.

2. User Stories
As a Team Member, I want to comment directly on a schedule activity, so that discussion about the work stays attached to the work instead of scattered across email or chat.
As a Project Manager, I want to @mention a specific stakeholder in a comment, so that I can draw their attention without them having to stumble across it on their own.
As a Team Member, I want to comment on a risk, so that mitigation discussion is visible to everyone with access to that risk, not buried in a side conversation.
As a Team Member, I want to edit or delete my own comments, with edits clearly marked, so that I can correct mistakes without erasing the record that an edit happened.

3. Functional Requirements
3.1 Threaded Comments
Support posting a comment on: a schedule activity, a generated document, or a risk.
Comments display in chronological order per entity, each showing author, timestamp, and body.
Support basic threading (a reply to a specific comment) or, at minimum, a flat chronological list if threading adds too much scope for this sprint — see Section 8.
3.2 @Mentions
Typing @ within a comment triggers a searchable picker.
The picker sources from the project's stakeholder register (Sprint 9) and/or platform users (organization_members), correctly resolving to a specific person, not a plain-text name match.
A resolved mention creates a distinct Mention record linked to the comment, separate from the comment's raw text — this is the record Sprint 17 will read to decide who to notify.
3.3 Comment Editing & Deletion
Support editing and deleting one's own comments.
An edited comment is visibly marked as edited (e.g., an "(edited)" label), preserving basic trust/transparency.
Deletion should be a soft delete (marking the comment as removed) rather than a hard delete, preserving activity-log traceability for Sprint 18.
3.4 Generic Comment Architecture
The comments table must reference its parent entity via a generic entity_type/entity_id pattern, not a separate foreign key column per entity type (e.g., not activity_id, document_id, risk_id as three separate nullable columns).
This pattern must be validated against at least one entity type not in this sprint's scope (e.g., issues from Sprint 11) to confirm it would require no schema change to extend — a design review exercise, not a built feature.

4. Acceptance Criteria
A user can post, edit, and delete a comment on a schedule activity, a document, and a risk, with all three using the same underlying comment component/pattern.
@mentioning a stakeholder correctly resolves to that specific person and creates a mention record, verified distinct from a plain-text mention of someone's name that isn't an actual @ reference.
An edited comment is visibly marked as edited; a deleted comment no longer displays its content but remains traceable in the underlying data (soft delete).
A design review confirms the comment model could support a new commentable entity type (e.g., issues) via configuration/a new entity_type value, with no changes to the comments table schema itself.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
comments and mentions inherit the same project-scoped RLS pattern established across every prior phase.
Permission Consistency
A comment's visibility must exactly mirror the underlying entity's existing RLS permissions — if a user can't see a risk, they must not be able to see its comments either, with no separate comment-level permission layer introduced in this sprint (per the Phase 6 PRD's Section 6.4 recommendation).
Data Integrity
Soft-deleted comments must never appear in normal comment views, but must remain queryable for Sprint 18's activity log and any future audit needs.
Extensibility
The entity_type/entity_id pattern must be genuinely reusable by Sprint 18's Attachment table and any future commentable/attachable entity type, without requiring changes to how existing entity types are referenced.


6. Implementation Task Breakdown: Sprint 16
[Phase 1: Comment Schema & RLS] ──> [Phase 2: Comment CRUD] ──> [Phase 3: @Mention Resolution] ──> [Phase 4: Extensibility Validation]

Phase 1: Comment Schema & Row Level Security
Goal: Provision the generic, polymorphic comment table that every future commentable entity type will use.
[ ] Task 1.1: Design Comment Schema


Create a SQL migration for public.comments (id, project_id, entity_type enum [activity/document/risk], entity_id, author_user_id, body, created_at, edited_at [nullable], deleted_at [nullable, soft delete]).
Create public.mentions (id, comment_id FK, mentioned_stakeholder_id [or mentioned_user_id]).
[ ] Task 1.2: Configure Row Level Security


Enable RLS on both tables, deriving comment visibility from the referenced entity's existing access rules rather than an independent policy (per Section 5's permission-consistency requirement).
Phase 2: Comment CRUD
Goal: Build the core posting, editing, and deletion experience.
[ ] Task 2.1: Build Comment Entry & Display Component


A reusable component for posting and displaying comments, designed to be embedded in the activity detail view, document detail view, and risk detail view identically.
[ ] Task 2.2: Implement Edit & Soft Delete


Wire edit (updating body, setting edited_at) and soft delete (setting deleted_at) actions, restricted to the comment's own author.
[ ] Task 2.3: Embed Comment Component in All Three Entity Views


Add the comment component to the Planning Core activity detail view, the Documentation Engine document view, and the Accountability Layer risk detail view.
Phase 3: @Mention Resolution
Goal: Build the mention-picker interaction and its underlying data record.
[ ] Task 3.1: Build Mention Picker UI


Implement @-triggered search, sourced from the project's stakeholder register and platform users.
[ ] Task 3.2: Implement Mention Record Creation


On comment save, parse resolved @-references and create corresponding mentions rows, distinct from any plain-text name occurrences in the comment body.
Phase 4: Extensibility Validation
Goal: Prove the architecture decision in Section 3.4 actually holds, before other sprints build on top of it.
[ ] Task 4.1: Design Review Against a Future Entity Type
Walk through adding "issue" as a fourth entity_type value and confirm no schema change would be required — document the outcome as a lightweight design note for future reference.

7. Sprint Delivery Milestones
Milestone 1 — Comment Data Layer Live (Target: Day 2) comments and mentions tables deployed with RLS confirmed, correctly deriving visibility from referenced entities.
Milestone 2 — Comment CRUD Working Across All Three Entities (Target: Day 5) Comments can be posted, edited, and soft-deleted on activities, documents, and risks, all using the same underlying component.
Milestone 3 — Mentions Resolving Correctly (Target: Day 7) @-mentions correctly resolve to specific people and create distinct mention records, verified against plain-text name false positives.
Milestone 4 — Extensibility Validated & Sprint Sign-Off (Target: Day 8) Design review confirms the entity-reference pattern extends cleanly to a future entity type with no schema change; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Threading depth: should comments support nested replies (a reply to a specific comment, potentially multiple levels deep), or a flat chronological list per entity? Flat is significantly simpler to ship and may be entirely sufficient for this use case — recommend flat for this sprint, with threading as a future enhancement if user feedback indicates a real need.
Mention resolution scope: should @ search include only stakeholders explicitly added to the project's register (Sprint 9), or all platform users in the organization/workspace, even if they aren't yet a formal project stakeholder? Recommend including both, since a PM may want to mention a colleague who hasn't been formally added as a stakeholder yet.
Comment permission edge case: confirm there's no scenario in the current RBAC model (Viewer/Client role, specifically) where someone should see an entity but not its comments — Section 5 assumes visibility always mirrors exactly, but Viewer/Client-facing use cases are worth a specific gut-check before this assumption is locked in.

End of Sprint 16 PRD. This sprint's entity_type/entity_id pattern is the foundation Sprint 18's file attachments will directly reuse, and Sprint 17's notifications will read the mentions table this sprint creates as its first (and for this phase, only) trigger source.

