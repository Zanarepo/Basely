Product Requirements Document (PRD)
Sprint 17: Collaboration Layer — Notifications

1. Objective & Scope
The objective of Sprint 17 is to build in-app and email notification delivery, triggered initially by Sprint 16's @mentions, with an architecture designed to accept additional trigger types — risk status changes, scheduled report readiness — without a redesign when those features are eventually wired up.
By the end of this sprint, a user will be able to:
Receive an in-app and email notification when someone @mentions them
Browse a notification center showing all their notifications, with read/unread state
Turn email notifications on or off globally
Out of scope for this sprint: any trigger type beyond @mentions (the architecture must support future triggers, but only mentions are actually wired up now), and per-trigger-type notification preference granularity (a global on/off toggle is sufficient for this sprint).
Hard dependency: This sprint requires Sprint 16 (Comments & Mentions) for the mentions records that are this sprint's only trigger source, and Foundation's (Sprint 1) transactional email infrastructure pattern, already established for invitation emails.

2. User Stories
As a Team Member, I want to be notified when someone @mentions me, so that I don't have to constantly check every activity, document, and risk for new comments.
As a Project Manager, I want to choose whether I receive notifications in-app only or also by email, so that I control how much the platform interrupts my day.
As a Team Member, I want a single in-app notification center, so that I can catch up on everything I've missed in one place rather than hunting through individual entities.

3. Functional Requirements
3.1 In-App Notifications
A notification center/inbox accessible from the main app navigation, showing all notifications for the current user.
Each notification shows enough context to be useful without opening the app — e.g., "Jane mentioned you on Activity 2.1: Foundation Excavation," not just "You were mentioned."
Support marking a notification as read (individually and "mark all as read"), with an unread count visible in the navigation.
3.2 Email Notifications
Delivered for the same trigger types as in-app notifications, reusing the transactional email infrastructure pattern from Foundation's Sprint 1 invitation emails.
Email content should mirror the in-app notification's context (who, what, where), with a direct link back into the app to the relevant entity.
3.3 Trigger Architecture
This sprint implements exactly one trigger type: @mentions (from Sprint 16).
The underlying trigger/delivery pipeline must be built generically — a trigger_type enum and a dispatch mechanism that doesn't hardcode "mention" as the only possible case — so that risk-status-change and scheduled-report-ready triggers (both explicitly deferred to future work per the Phase 6 PRD) can be added later as new trigger-generation code, without changes to the delivery pipeline itself.
3.4 Notification Preferences
A per-user setting for whether email notifications are enabled, applied globally across all trigger types for this sprint.
Per-trigger-type granularity (e.g., "email me for mentions but not X") is explicitly deferred — the schema should not block adding it later, but it is not required now.

4. Acceptance Criteria
A user who is @mentioned receives both an in-app notification and an email (if enabled) within a target delivery window of under 1 minute from the mention being posted.
Marking a notification as read in-app correctly updates its state and is reflected in the notification center's unread count.
Disabling email notifications correctly stops email delivery while in-app notifications continue to be created normally.
A design/architecture review confirms a second, not-yet-built trigger type (e.g., risk status change) could be added by inserting new trigger-generation code, without modifying the core notification delivery pipeline.

5. Non-Functional & Security Requirements
Requirement
Detail
Performance
Notification delivery (in-app creation + email dispatch) should complete within 1 minute of the triggering event under normal load.
Data Isolation
notifications and notification_preferences must be scoped so a user only ever sees and manages their own — this is stricter than the general project-scoped RLS pattern used elsewhere, since notifications are inherently personal, not project-shared, data.
Reliability
Email delivery failures (e.g., a transactional email provider outage) must not silently drop the in-app notification — the two delivery paths should fail independently, not as an all-or-nothing unit.
Extensibility
The trigger/dispatch architecture must support new trigger types via configuration/new trigger-generation code only, with no changes required to the core delivery pipeline — this is the central design bet of this sprint.


6. Implementation Task Breakdown: Sprint 17
[Phase 1: Notification Schema & RLS] ──> [Phase 2: Mention Trigger Wiring] ──> [Phase 3: In-App Delivery] ──> [Phase 4: Email Delivery] ──> [Phase 5: Preferences & Extensibility Validation]
Phase 1: Notification Schema & Row Level Security
Goal: Provision the tables that hold notification data and user preferences.
Task 1.1: Design Notification Schema
Create a SQL migration for public.notifications (id, user_id, trigger_type enum [mention], reference_entity_type, reference_entity_id, content_summary, read_at [nullable], created_at).
Task 1.2: Design Notification Preferences Schema
Create public.notification_preferences (id, user_id, email_enabled boolean).
Task 1.3: Configure Row Level Security
Enable RLS scoped strictly to user_id = auth.uid() on both tables — stricter than the standard project-scoped pattern, since notifications are personal data.
Phase 2: Mention Trigger Wiring
Goal: Connect Sprint 16's mention creation to this sprint's notification pipeline.
Task 2.1: Build Mention-to-Notification Dispatcher
On mentions row creation (Sprint 16), generate a corresponding notifications row with trigger_type = 'mention' and a content summary referencing the source comment/entity.
Task 2.2: Design the Generic Dispatch Interface
Build the dispatcher as a generic function accepting a trigger type and payload, rather than a mention-specific one-off, so future trigger types can call the same entry point.
Phase 3: In-App Notification Delivery
Goal: Build the notification center experience.
Task 3.1: Build Notification Center UI
List view of all notifications for the current user, showing content summary, timestamp, and read/unread state.
Task 3.2: Implement Read/Unread State
Mark-as-read (individual and bulk) actions, with an unread count badge in the main navigation.
Phase 4: Email Notification Delivery
Goal: Extend delivery to email using existing infrastructure.
Task 4.1: Build Email Template for Mentions
Reuse the transactional email pattern from Sprint 1, with content mirroring the in-app notification and a direct link to the relevant entity.
Task 4.2: Wire Email Dispatch Alongside In-App Creation
Ensure email dispatch happens independently of in-app notification creation, so a failure in one path doesn't block the other.
Phase 5: Preferences & Extensibility Validation
Goal: Let users control email delivery, and confirm the architecture's core promise holds.
Task 5.1: Build Notification Preferences UI
A simple settings toggle for enabling/disabling email notifications globally.
Task 5.2: Design Review for Future Trigger Types
Walk through adding a hypothetical "risk status change" trigger type and confirm it would only require new trigger-generation code, not changes to the dispatch/delivery pipeline built in Phases 2–4.

7. Sprint Delivery Milestones
Milestone 1 — Notification Data Layer Live (Target: Day 2) notifications and notification_preferences tables deployed with strict per-user RLS confirmed.
Milestone 2 — Mention Notifications Firing (Target: Day 5) @mentions correctly generate notification records via the generic dispatcher, with in-app delivery working end-to-end.
Milestone 3 — Email Delivery Working (Target: Day 7) Email notifications are correctly sent for mentions, independently of in-app delivery, respecting the under-1-minute delivery target.
Milestone 4 — Preferences, Extensibility & Sprint Sign-Off (Target: Day 9) Email preference toggle works correctly; design review confirms the architecture supports future trigger types without pipeline changes; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Notification digest option: should there be a "daily summary" email option instead of one email per mention, to reduce notification fatigue on active projects? As flagged in the Phase 6 PRD, this is worth deciding now — if digest batching is wanted eventually, designing the email dispatch queue with that in mind now is considerably easier than retrofitting it after Sprint 17 ships as purely real-time.
Cross-project notification aggregation: should the notification center show notifications from all of a user's projects in one unified list, or does the user need to switch project context to see project-specific notifications? Given the platform's multi-project workspace model (Foundation), a unified cross-project inbox is likely the more useful default — worth confirming before Task 3.1's UI is finalized.
Mention self-notification: if a user mentions themselves (or is the author of a comment containing their own name coincidentally matched — though Sprint 16's resolved-mention approach should prevent the latter), should a self-mention generate a notification? Recommend suppressing self-notifications as an obvious quality-of-life exclusion.
Retention/cleanup of old notifications: should notifications be retained indefinitely, or is there a reasonable archival/deletion policy (e.g., auto-archive after 90 days)? Worth a decision before this becomes a real data-volume concern, though not urgent to resolve before this sprint ships.

End of Sprint 17 PRD. This sprint's generic dispatch architecture is the single most important deliverable in this phase — it's what turns "we built mention notifications" into "we built a notification system," and is the direct unblock for the risk-status and scheduled-report notifications deferred from earlier phases. Sprint 18 (Activity Log & File Attachments) closes out the phase with two more cross-cutting, comparatively lower-complexity additions.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 
