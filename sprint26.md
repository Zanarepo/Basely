Product Requirements Document (PRD)
Sprint 26: Integrations — File Storage Integration

1. Objective & Scope
The objective of Sprint 26 is to extend Collaboration Layer's Sprint 18 file attachment feature to support attaching files directly from Google Drive or SharePoint, as references rather than uploaded copies.
By the end of this sprint, a user will be able to:
Connect their Google Drive or SharePoint account
Browse and select a file from either service to attach to a schedule activity or WBS deliverable
See that attachment clearly marked as a linked reference, not a duplicated copy
Out of scope for this sprint: any other cloud storage provider beyond Google Drive/SharePoint, and comment-level attachments (Sprint 18 explicitly scoped attachments to the entity level only).
Hard dependency: This sprint requires Collaboration Layer's Sprint 18 attachments table and polymorphic entity-reference pattern to already exist — this sprint extends that table rather than building a new one.

2. User Stories
As a Team Member, I want to attach a file that's already in our team's Google Drive, so that I don't have to download and re-upload a copy that then goes out of sync with the original.
As a Project Manager, I want attachments to link back to the source file in Drive/SharePoint, so that the platform doesn't become yet another place a document's "real" version might live.

3. Functional Requirements
3.1 Google Drive Connection
A user can connect their Google account via OAuth and browse their Drive files (with appropriate folder/search navigation) to select a file to attach.
3.2 SharePoint Connection
A user can connect their Microsoft/SharePoint account via OAuth and browse SharePoint/OneDrive files equivalently.
3.3 Reference, Not Copy
An attachment sourced from Drive/SharePoint stores a reference (file ID/link) to the source file — the platform does not download and store a duplicate copy.
Opening a Drive/SharePoint-sourced attachment navigates to the source file in its native application/context (or an embedded preview, if feasible), not a platform-hosted copy.
3.4 Attachment Model Extension
Extend Sprint 18's attachments table with a source_type (local/google_drive/sharepoint) and external_reference field, rather than building a separate table for cloud-sourced attachments.
The existing entity-level attachment UI (activity detail, WBS deliverable) should support both local upload and cloud-file selection through the same interface, not two disconnected UIs.
3.5 Visual Distinction
Cloud-sourced attachments are visually distinguishable in the attachment list (e.g., a Drive or SharePoint icon), so users understand at a glance that it's a reference rather than a platform-stored file.

4. Acceptance Criteria
A user can browse and select a file from a connected Google Drive account and attach it to a schedule activity, with the attachment correctly linking back to the source file.
The same capability works correctly for a connected SharePoint account.
A cloud-sourced attachment is visually distinguishable from a locally-uploaded file in the attachment list.
Opening a cloud-sourced attachment correctly navigates to or previews the source file, not a platform-stored duplicate.

5. Non-Functional & Security Requirements
Requirement
Detail
Security
OAuth tokens for Drive/SharePoint connections must be stored securely (encrypted at rest), consistent with Sprint 25's calendar connection security requirement.
Data Isolation
Connections are scoped to the connecting user; a connected account must never expose another user's cloud files.
Consistency
This sprint must extend Sprint 18's existing attachments table and entity-reference pattern, not introduce a parallel attachment system for cloud files.
Access Respect
The platform must respect the source file's own sharing permissions in Drive/SharePoint — attaching a reference does not grant platform users access beyond what they already have to the source file through Google/Microsoft's own permission model.


6. Implementation Task Breakdown: Sprint 26
[Phase 1: Attachment Schema Extension & OAuth] ──> [Phase 2: Google Drive Integration] ──> [Phase 3: SharePoint Integration] ──> [Phase 4: Unified Attachment UI]

Phase 1: Attachment Schema Extension & OAuth
Goal: Extend the existing attachment model and build shared cloud-storage OAuth handling.
[ ] Task 1.1: Extend Attachment Schema


Add source_type and external_reference columns to Sprint 18's attachments table via migration.
[ ] Task 1.2: Build Shared Cloud Storage OAuth Handling


Implement OAuth connect/refresh/disconnect flows generically enough to support both Google Drive and SharePoint without duplicating token-management logic (reusing patterns from Sprint 25 where applicable).
Phase 2: Google Drive Integration
Goal: Build browsing and selection against the Google Drive API.
[ ] Task 2.1: Build Drive File Browser


Implement a file picker/browser UI against the Google Drive API, supporting folder navigation and search.
[ ] Task 2.2: Implement Reference Attachment


On file selection, create an attachments row with source_type = 'google_drive' and the appropriate external_reference.
Phase 3: SharePoint Integration
Goal: Build the equivalent capability for SharePoint/OneDrive.
[ ] Task 3.1: Build SharePoint File Browser


Implement the equivalent file picker against the Microsoft Graph API for SharePoint/OneDrive.
[ ] Task 3.2: Implement Reference Attachment (SharePoint)


Mirror Task 2.2's attachment-creation logic for source_type = 'sharepoint'.
Phase 4: Unified Attachment UI
Goal: Bring local upload and cloud-file selection into a single, coherent interface.
[ ] Task 4.1: Build Unified Attachment Picker


Extend Sprint 18's attachment UI to offer "Upload a file," "Choose from Google Drive," and "Choose from SharePoint" as options within the same interface.
[ ] Task 4.2: Implement Visual Source Indicators


Add distinct icons/labels for local vs. Drive vs. SharePoint attachments in the attachment list.

7. Sprint Delivery Milestones
Milestone 1 — Schema Extension & OAuth Live (Target: Day 2) attachments table extended; shared cloud-storage OAuth flow working for at least one provider.
Milestone 2 — Google Drive Integration Working (Target: Day 5) Users can browse and attach files from Google Drive as correctly-linked references.
Milestone 3 — SharePoint Integration Working (Target: Day 7) Users can browse and attach files from SharePoint as correctly-linked references.
Milestone 4 — Unified UI & Sprint Sign-Off (Target: Day 9) A single attachment interface offers local upload and both cloud sources, with correct visual distinction; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Preview support: should cloud-sourced attachments support an inline preview (e.g., an embedded Google Docs viewer) or is a simple "open in new tab" link to the source sufficient for launch? Recommend a simple link for this sprint, with inline preview as a nice-to-have enhancement.
Broken/revoked reference handling: if a user's Google/SharePoint access to a previously-attached file is later revoked (e.g., they leave the shared folder), how should the platform surface that the attachment is now broken? Recommend a simple "unable to access" indicator on click, rather than proactively polling every attachment's validity.
Multiple accounts per user: should a user be able to connect more than one Google account (e.g., a personal and a work account) for file browsing? Recommend single-account-per-provider for launch simplicity, revisiting if this proves to be a real limitation.

End of Sprint 26 PRD. Like Sprint 25, this sprint is comparatively self-contained and could be resequenced independently of the tighter Sprint 27→28 dependency chain if scheduling needs require it.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

