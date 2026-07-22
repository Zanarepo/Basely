Product Requirements Document (PRD)
Sprint 22: Administration & Governance — Approval Workflows

1. Objective & Scope
The objective of Sprint 22 is to build configurable approval workflows for sensitive actions, starting with budget baseline saves and schedule baseline saves — letting an organization require sign-off before these actions take effect, rather than any PM being able to act unilaterally.
By the end of this sprint, an organization admin will be able to:
Enable approval requirements for specific action types
Have a PM's gated action create a pending request instead of immediately committing
Let a designated approver review, approve, or reject that request, with the underlying data only changing on approval
Out of scope for this sprint: approval workflows for action types beyond budget/schedule baselines (the action_type enum is left open for future extension, but only these two are wired up now), and the dedicated governance audit log (Sprint 23 — this sprint should still emit basic logging, but the compliance-grade audit table is built next).
Hard dependency: This sprint requires Cost Core's Sprint 5 (budget baseline save) and Planning Core's Sprint 3 (schedule baseline save) to be complete, since this sprint intercepts those exact save operations. It also benefits from Sprint 21's SSO for reliable identity, though it doesn't strictly require it.

2. User Stories
As an Enterprise PMO Director, I want budget baseline changes to require approval before taking effect, so that a PM can't unilaterally rebaseline a budget without oversight.
As a Project Manager, I want to submit a change for approval and see its status, so that I know whether my proposed change is pending, approved, or rejected.
As an Approver, I want a clear queue of items awaiting my sign-off, so that I don't have to be told out-of-band that something needs my attention.

3. Functional Requirements
3.1 Configurable Approval Requirement
An organization admin can enable/disable an approval requirement for each supported action type, currently: budget baseline save, schedule baseline save.
When disabled (the default), these actions behave exactly as they did before this sprint — no regression to existing Cost Core/Planning Core behavior for organizations that don't opt in.
3.2 Approval Request Flow
When a gated action is attempted in an organization with that action type's approval enabled, the action does not immediately commit — instead, it creates a pending ApprovalRequest storing the proposed change as data.
The requester sees clear confirmation that their action is now pending approval, not silently queued with no feedback.
3.3 Approver Assignment
Approvers are defined per organization, using a role-based model for this sprint (e.g., "any user with the Admin role can approve") rather than named-individual assignment — per the Phase 8 PRD's recommendation.
An approver has a queue showing all pending requests they're eligible to act on.
3.4 Approval Actions
An approver can approve or reject a pending request, optionally with a comment.
On approval, the underlying change (e.g., the budget baseline) is committed exactly as originally proposed.
On rejection, the underlying data remains completely unchanged from its pre-request state, with the rejection reason visible to the requester.
3.5 Requester Visibility & Notification
The requester can see their request's current status (pending/approved/rejected) at any time.
Wire a basic notification to the approver queue via Collaboration Layer's existing notification system (Sprint 17), reusing its generic trigger architecture rather than building a separate notification mechanism — an approval queue nobody is alerted to defeats much of the feature's purpose.

4. Acceptance Criteria
Attempting a gated action (e.g., saving a budget baseline) in an organization with approval workflows enabled correctly creates a pending approval request instead of immediately committing the change.
An approver can view their pending queue, approve or reject a request, and the underlying action correctly takes effect (or doesn't) based on that decision.
A rejected approval request leaves all underlying data completely unchanged from its pre-request state, verified by comparing full before/after data snapshots.
A requester can see the current status of their submitted request, and receives a notification-driven signal (per Section 3.5) rather than needing to check manually.
An organization with approval workflows disabled sees zero behavior change from pre-Sprint-22 baseline save behavior.

5. Non-Functional & Security Requirements
Requirement
Detail
Security
Approval policy configuration (which action types are gated, who can approve) must be restricted to organization Admin role only.
Data Integrity
A rejected or still-pending approval request must have zero effect on live data — the proposed change lives only in ApprovalRequest.payload until approved, never partially applied.
Data Isolation
ApprovalPolicy and ApprovalRequest are strictly organization/project-scoped, consistent with every prior phase's RLS pattern.
Backward Compatibility
Organizations that don't enable approval workflows must see zero change to existing Cost Core/Planning Core baseline-save behavior — this sprint must not regress existing functionality for non-enterprise customers.
Extensibility
ApprovalPolicy.action_type must remain an open enum so future gated action types can be added without a schema change.


6. Implementation Task Breakdown: Sprint 22
[Phase 1: Approval Schema & Policy Configuration] ──> [Phase 2: Gated Action Interception] ──> [Phase 3: Approver Queue & Decision UI] ──> [Phase 4: Requester Visibility & Notification]

Phase 1: Approval Schema & Policy Configuration
Goal: Provision the tables and let admins configure which actions are gated.
[ ] Task 1.1: Design Approval Schema


Create SQL migrations for public.approval_policies (id, organization_id, action_type enum [budget_baseline/schedule_baseline], approver_definition, enabled) and public.approval_requests (id, policy_id, requested_by_user_id, status enum [pending/approved/rejected], decided_by_user_id [nullable], decision_comment [nullable], payload [JSON], created_at, decided_at [nullable]).
[ ] Task 1.2: Build Policy Configuration UI


Admin-facing interface to enable/disable approval requirements per action type.
[ ] Task 1.3: Configure Row Level Security


Restrict policy configuration to Admin role; restrict request visibility to the requester and eligible approvers only.
Phase 2: Gated Action Interception
Goal: Intercept the two existing save operations without breaking them for organizations that haven't opted in.
[ ] Task 2.1: Intercept Budget Baseline Save


Modify Cost Core's Sprint 5 baseline-save operation to check for an active approval_policies entry; if enabled, create an ApprovalRequest with the proposed baseline data instead of committing directly.
[ ] Task 2.2: Intercept Schedule Baseline Save


Apply the same interception pattern to Planning Core's Sprint 3 baseline-save operation.
[ ] Task 2.3: Verify No Regression for Disabled Policies


Confirm both baseline-save operations behave identically to their pre-Sprint-22 behavior when the relevant policy is disabled or doesn't exist.
Phase 3: Approver Queue & Decision UI
Goal: Give approvers a clear, actionable queue.
[ ] Task 3.1: Build Approver Queue View


List all pending requests the current user is eligible to act on, based on the role-based approver assignment model.
[ ] Task 3.2: Implement Approve/Reject Actions


Wire approve (commit the payload to the live table) and reject (mark rejected, leave live data untouched) actions, with an optional decision comment.
Phase 4: Requester Visibility & Notification
Goal: Close the loop back to the person who requested the change.
[ ] Task 4.1: Build Requester Status View


Interface for a PM to see the status of their own submitted requests.
[ ] Task 4.2: Wire Approver Notification


Trigger a notification (via Sprint 17's generic dispatch architecture) to eligible approvers when a new request is created, and to the requester when a decision is made.

7. Sprint Delivery Milestones
Milestone 1 — Approval Schema & Policy Config Live (Target: Day 3) approval_policies and approval_requests tables deployed with RLS confirmed; admins can enable/disable approval per action type.
Milestone 2 — Gated Interception Working, No Regression (Target: Day 6) Budget and schedule baseline saves correctly create pending requests when gated, and behave exactly as before when not — verified with explicit regression tests.
Milestone 3 — Approver Queue & Decisions Working (Target: Day 9) Approvers can view their queue and approve/reject requests, with correct data commit/no-commit behavior in both outcomes.
Milestone 4 — Notification, Requester Visibility & Sprint Sign-Off (Target: Day 12) Requesters and approvers are correctly notified via Sprint 17's system; all Section 4 acceptance criteria pass — this milestone closes out approval workflows for this phase.

8. Open Questions Carried Into This Sprint
Approver assignment granularity: is role-based approval (any Admin can approve) sufficient for launch, or do some organizations need named-individual approvers (e.g., specifically the CFO for budget changes)? Recommend role-based for this sprint, with named-individual assignment flagged as a clear next-iteration enhancement given the approver_definition field is designed to support it later.
Multiple pending requests on the same entity: if a PM submits a new budget baseline request while a prior one for the same project is still pending, should the new request be blocked, queued behind the first, or allowed to exist independently? Recommend blocking a second concurrent request on the same entity to avoid confusing, potentially conflicting pending states.
Partial approval / delegation: should an approver be able to delegate their approval authority temporarily (e.g., while on vacation)? Reasonable future enhancement, not required for this sprint's launch scope.
Approval request expiration: should a pending request that's never acted on eventually expire or escalate (e.g., auto-escalate after 7 days)? Not required for this sprint, but worth flagging as a governance gap if left entirely open-ended.

End of Sprint 22 PRD. This sprint's ApprovalRequest.payload design — storing the proposed change as data rather than touching the live table until approved — is the single most important correctness decision in this sprint, and should be treated as non-negotiable in code review even if it seems like extra complexity for a "simple" approve/reject flow.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 
