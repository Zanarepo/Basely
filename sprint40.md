Product Requirements Document (PRD)
Sprint 40: Document Library — Meeting Minutes & Action Item Tracker

1. Objective & Scope
The objective of Sprint 40 is to build the first two genuinely new Execution-stage artifacts: structured Meeting Minutes and a lightweight Action Item Tracker distinct from full schedule activities.
By the end of this sprint, a user will be able to:
Record a meeting's date, attendees, discussion summary, and decisions in a structured format
Spawn one or more action items directly from meeting minutes, or create them standalone
Track action items independently, without them participating in CPM scheduling
Out of scope for this sprint: any formal document export of Meeting Minutes through Documentation Engine (this sprint focuses on capture; export can reuse Documentation Engine's pattern in a later fast-follow if needed) — the primary deliverable here is the data model and in-app experience.
Hard dependency: This sprint requires Accountability Layer's Sprint 9 (stakeholder register, for attendees/owners) and benefits from, but doesn't require, Collaboration Layer's Sprint 16 comment/mention patterns for cross-referencing.

2. User Stories
As a Project Manager, I want to record structured meeting minutes, so that decisions and discussion are documented consistently rather than living only in someone's memory or a scattered email.
As a Project Manager, I want to capture action items during a meeting and track them afterward, so that commitments made in a meeting don't get forgotten once everyone leaves the room.
As a Team Member, I want to see my assigned action items separate from my scheduled tasks, so that lightweight commitments don't get confused with formal, CPM-scheduled work.

3. Functional Requirements
3.1 Meeting Minutes
New entity: meeting date, attendees (selected from the Sprint 9 stakeholder register), agenda/discussion summary, and decisions made.
Structured into distinct fields (not a single free-text blob) — at minimum: date, attendees list, discussion notes, decisions list — so minutes remain scannable rather than requiring a full read to extract what was decided.
Decisions recorded in minutes can optionally link to the entity they affect (e.g., a decision about a specific risk or activity), reusing Collaboration Layer's entity-reference pattern where it fits, but Meeting Minutes remains its own distinct entity — not built on top of comments.
3.2 Action Item Tracker
New, lightweight entity: description, owner (from the stakeholder register), due date, status (open/in progress/done).
Can originate from a Meeting Minutes entry (captured during minutes creation) or be created standalone, independent of any meeting.
Explicitly distinct from Planning Core's activities — action items do not participate in CPM scheduling, have no float, and are not part of the critical path calculation. This distinction must be clear in every view that might show both action items and schedule activities side by side.

4. Acceptance Criteria
Meeting Minutes can be created with structured attendees, discussion, and decisions, and one or more Action Items can be spawned directly from the minutes-creation flow.
Action Items are trackable independently of Meeting Minutes (creatable standalone), with owner and due date, and are visually and structurally distinguishable from schedule activities everywhere both might appear.
An action item spawned from a meeting retains a traceable link back to the originating minutes entry.

5. Non-Functional & Security Requirements
Requirement
Detail
Conceptual Separation
Action Items must never be confused with or merged into Planning Core's activities table — this is a deliberate, permanent distinction, not a temporary simplification.
Data Isolation
Both entities inherit the project-scoped RLS pattern established across every prior phase.
Extensibility
The schema should not block a future Documentation Engine export of Meeting Minutes as a formatted document, even though that's out of this sprint's scope.


6. Implementation Task Breakdown: Sprint 40
[Phase 1: Meeting Minutes Schema & UI] ──> [Phase 2: Action Item Schema & UI] ──> [Phase 3: Minutes-to-Action-Item Flow] ──> [Phase 4: Visual Distinction from Activities]

Phase 1: Meeting Minutes Schema & UI
[ ] Task 1.1: Design public.meeting_minutes (id, project_id, meeting_date, attendee_stakeholder_ids [array], discussion_notes, decisions [structured list]).
[ ] Task 1.2: Build the meeting minutes entry form and list view.
Phase 2: Action Item Schema & UI
[ ] Task 2.1: Design public.action_items (id, project_id, description, owner_stakeholder_id, due_date, status, source_meeting_minutes_id [nullable FK]).
[ ] Task 2.2: Build the action item entry form and list/tracker view.
Phase 3: Minutes-to-Action-Item Flow
[ ] Task 3.1: Build the in-flow "capture as action item" interaction directly within meeting minutes creation/editing.
Phase 4: Visual Distinction from Activities
[ ] Task 4.1: Ensure any combined view (e.g., a "my work" list) that might show both action items and schedule activities clearly labels and visually separates the two.

7. Sprint Delivery Milestones
Milestone 1 — Meeting Minutes Working (Target: Day 3) Minutes can be created with structured attendees, discussion, and decisions.
Milestone 2 — Action Items Working (Target: Day 6) Action items can be created standalone, with owner and due date correctly tracked.
Milestone 3 — Minutes-to-Action-Item Flow Working (Target: Day 7) An action item spawned from minutes retains a traceable link back to its origin.
Milestone 4 — Sprint Sign-Off (Target: Day 8) Visual distinction from schedule activities is confirmed in every combined view; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Decision-to-entity linking scope: should a decision recorded in minutes support linking to any entity type (risks, activities, documents), reusing Collaboration Layer's polymorphic pattern fully, or is free-text-only sufficient for this sprint's launch? Recommend supporting the link where the polymorphic pattern already exists (low additional cost), but not blocking the sprint on covering every possible entity type.
Recurring meetings: should the platform support a recurring meeting template (e.g., a weekly standup) that pre-populates attendees each time, or is every meeting entry independent? Recommend independent entries for this sprint's launch simplicity, with recurring templates as a natural future enhancement.
Action item notification: should assigning an action item to someone trigger a notification via Collaboration Layer's Sprint 17 infrastructure? Recommend yes, since this mirrors the same pattern already used for RACI assignment and approval requests — worth including as a small addition rather than treating it as a separate future task.

End of Sprint 40 PRD. Phase 4's visual-distinction requirement is easy to underestimate — without deliberate UI separation, Action Items and schedule Activities will look confusingly similar to end users, undermining the entire point of keeping them as separate, lighter-weight concepts.
Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.

