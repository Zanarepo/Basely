Product Requirements Document (PRD)
Sprint 25: Integrations — Calendar Sync

1. Objective & Scope
The objective of Sprint 25 is to build outbound calendar sync — letting a user connect their Google Calendar or Outlook Calendar and see their project's milestones and assigned deadlines appear automatically, without having to check the platform separately.
By the end of this sprint, a user will be able to:
Connect their Google Calendar or Outlook Calendar via OAuth
Choose which of their projects sync to their calendar
See milestones (and optionally assigned activity due dates) appear as calendar events
Disconnect sync cleanly at any time
Out of scope for this sprint: inbound sync (detecting a calendar-side change and reflecting it back into the platform schedule) — explicitly deferred per the parent Phase 9 PRD, given the added complexity of reconciling two-way conflicts.
Hard dependency: This sprint requires Planning Core's Sprint 3 for milestone data and, optionally, Accountability Layer's Sprint 10 for RACI-assigned activity ownership if per-user assigned-activity sync is included. It has no dependency on other Integrations sprints — this is the most self-contained sprint in the phase.

2. User Stories
As a Project Manager, I want my project's milestones to appear on my personal calendar, so that I see deadlines alongside my other commitments without having to check the platform separately.
As a Team Member, I want an activity assigned to me to show up on my calendar with its due date, so that I don't miss it because I forgot to check the platform.
As a user with many projects, I want to choose which projects sync to my calendar, so that I'm not flooded with milestones from projects I only loosely follow.

3. Functional Requirements
3.1 Calendar Connection
Support connecting a Google Calendar account via OAuth.
Support connecting an Outlook Calendar account via OAuth.
Store connection credentials securely, with token refresh handled transparently (no repeated re-authentication prompts under normal use).
3.2 Sync Content
Sync schedule milestones (Planning Core, activity type = milestone) as calendar events, including name and date.
Optionally sync activities where the current user holds a Responsible or Accountable RACI role (Sprint 10), with their due date — confirm this is in scope for launch, see Section 8.
3.3 Sync Scope Control
A user can select which of their projects sync to their connected calendar, rather than an all-or-nothing connection covering every project they have access to.
Changing project sync selection takes effect on the next sync cycle without requiring a full reconnect.
3.4 Disconnection
A user can disconnect calendar sync at any time.
Disconnecting stops all future syncing; whether previously-synced events are cleaned up automatically or left in place is a UX decision — see Section 8.

4. Acceptance Criteria
A user connecting their Google Calendar correctly sees their selected project's milestones appear as calendar events within a reasonable sync delay (target: under 15 minutes).
The same works correctly for a connected Outlook Calendar account.
A user can select specific projects to sync and confirm that only those projects' milestones appear on their calendar, not every project they have access to.
Disconnecting calendar sync correctly and immediately stops future syncing.

5. Non-Functional & Security Requirements
Requirement
Detail
Security
OAuth tokens for calendar connections must be stored securely (encrypted at rest) and never exposed in logs or client-side code.
Reliability
Token refresh must happen transparently; an expired/revoked token should surface a clear reconnection prompt rather than silently failing to sync with no user-visible indication.
Data Isolation
Calendar connections are strictly scoped to the connecting user — one user's calendar connection must never sync or expose another user's project data.
Performance
Sync should run on a reasonable interval (e.g., every 15 minutes) rather than continuous polling that could strain either the platform or the calendar provider's API rate limits.


6. Implementation Task Breakdown: Sprint 25
[Phase 1: Connection Schema & OAuth] ──> [Phase 2: Google Calendar Sync] ──> [Phase 3: Outlook Calendar Sync] ──> [Phase 4: Scope Control & Disconnection]

Phase 1: Connection Schema & OAuth
Goal: Provision the connection table and build the shared OAuth handling both calendar providers will use.
[ ] Task 1.1: Design Calendar Connection Schema


Create a SQL migration for public.calendar_connections (id, user_id, provider enum [google/outlook], oauth_token_ref, synced_project_ids [array], created_at).
[ ] Task 1.2: Build Shared OAuth Handling


Implement OAuth connect/refresh/disconnect flows generically enough to support both providers without duplicating the token-management logic.
[ ] Task 1.3: Configure Row Level Security


Restrict calendar_connections access strictly to the connecting user.
Phase 2: Google Calendar Sync
Goal: Implement sync against the Google Calendar API.
[ ] Task 2.1: Build Milestone-to-Event Sync


Implement the sync job pushing milestone data as calendar events via the Google Calendar API.
[ ] Task 2.2: Handle Sync Updates and Deletions


Ensure a milestone date change or deletion correctly updates or removes the corresponding calendar event on the next sync cycle.
Phase 3: Outlook Calendar Sync
Goal: Implement the equivalent sync against the Outlook Calendar API.
[ ] Task 3.1: Build Milestone-to-Event Sync (Outlook)


Implement the equivalent sync job for Outlook, reusing as much of Phase 2's shared logic as the two APIs' differences allow.
[ ] Task 3.2: Handle Sync Updates and Deletions (Outlook)


Mirror Phase 2's update/deletion handling for Outlook.
Phase 4: Scope Control & Disconnection
Goal: Let users control what syncs and cleanly disconnect.
[ ] Task 4.1: Build Project Sync Selection UI


Interface for choosing which projects sync to the connected calendar.
[ ] Task 4.2: Implement Disconnection


Build the disconnect action, per the Section 8 decision on whether to clean up previously-synced events.

7. Sprint Delivery Milestones
Milestone 1 — Connection Layer Live (Target: Day 2) calendar_connections schema deployed; shared OAuth connect/refresh flow working for at least one provider.
Milestone 2 — Google Calendar Sync Working (Target: Day 5) Milestones correctly sync to a connected Google Calendar, including updates and deletions.
Milestone 3 — Outlook Calendar Sync Working (Target: Day 7) Milestones correctly sync to a connected Outlook Calendar, matching Google's behavior.
Milestone 4 — Scope Control, Disconnection & Sprint Sign-Off (Target: Day 9) Project sync selection and disconnection both work correctly; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Assigned-activity sync inclusion: should this sprint sync only milestones, or also activities where the user holds a Responsible/Accountable RACI role? Milestones alone is simpler and may be sufficient for launch; including assigned activities adds real value but also real scope (many more events, potential noise) — recommend milestones-only for this sprint, with assigned-activity sync as a clear fast-follow.
Disconnection cleanup: should disconnecting calendar sync delete previously-synced events from the user's calendar, or leave them in place as a historical record? Recommend leaving them in place by default (simpler, less risk of accidentally deleting a user's own calendar data) with an optional "also remove synced events" action.
Sync frequency: is a 15-minute sync interval appropriate, or do PMs need faster (e.g., near-real-time) sync for milestone changes? Recommend starting with a scheduled interval for simplicity and cost, revisiting if real-time proves necessary.

End of Sprint 25 PRD. This is the most self-contained sprint in the Integrations phase — it has no dependency on Sprints 26–28 and could be resequenced earlier or later relative to them if scheduling needs require it, unlike the tighter dependency chain in Sprints 27→28.
Hard Acceptancy criteria: Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

