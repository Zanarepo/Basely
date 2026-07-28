Product Requirements Document (PRD)
Sprint 41: Document Library — Change Request Log (All Tiers) & Deliverable Sign-off Sheets

1. Objective & Scope
The objective of Sprint 41 is to extend change-request tracking to every subscription tier (today it only exists as Enterprise-only Approval Workflows), and to build a genuine deliverable-acceptance capture mechanism distinct from Phase 11's whole-project closure sign-off.
By the end of this sprint:
Every organization, regardless of tier, can log requested changes to scope/schedule/budget and their outcome
Enterprise organizations with approval workflows enabled see this log reflect their existing ApprovalRequest data, not a duplicate
A PM can capture formal acceptance of an individual deliverable, from an internal user or an external stakeholder with no platform account
Out of scope for this sprint: any change to Administration & Governance's Sprint 22 approval-workflow gating logic itself — this sprint adds a lighter-weight, universally-available log alongside it, not a replacement.
Hard dependency: This sprint requires Administration & Governance's Sprint 22 (ApprovalRequest data, for Enterprise organizations) and Back Office's Sprint 29 (tier-check infrastructure, to distinguish Enterprise from other tiers). It also reuses Phase 11's Sprint 35 external-sign-off token pattern for the Deliverable Sign-off's external-stakeholder case.

2. User Stories
As a Project Manager on any tier, I want to log a requested change to scope, schedule, or budget along with its outcome, so that change history is documented even if I'm not on the Enterprise plan with full approval workflows.
As an Enterprise PMO Director, I want my Change Request Log to reflect my existing approval workflow data, not a second, disconnected record of the same changes.
As a Project Manager, I want to capture formal sign-off on an individual deliverable, so that acceptance is documented as it happens throughout the project, not only once at the very end.
As an external client with no platform account, I want to review and accept a specific deliverable via a simple link, consistent with how I'd eventually accept the whole project's closure.

3. Functional Requirements
3.1 Change Request Log (All Tiers)
A new, universally-available log entity: requested change description, rationale, and outcome (approved/rejected/withdrawn).
For organizations without approval workflows enabled (i.e., every tier except Enterprise-with-the-feature-on), this is a simple, ungated log a PM fills in themselves — no approval gating machinery required.
For Enterprise organizations with approval workflows enabled, this log's entries are read directly from existing ApprovalRequest records (Sprint 22) — never duplicated. The tier-check from Back Office's Sprint 29 determines which data source a given organization's Change Request Log view reads from.
3.2 Deliverable Sign-off Sheets
New entity capturing formal acceptance of an individual deliverable (tied to a specific WBS work package's deliverables field): who accepted it, when, and any conditions/notes.
Deliberately distinct from Phase 11's project-level Client/Stakeholder Sign-off — this is per-deliverable, can happen many times across a single project's execution, not once at closure.
Supports both an internal, authenticated sign-off action and an external, token-based link for stakeholders without a platform account — reusing Phase 11's Sprint 35 external sign-off mechanism exactly, not building a second one.
Immutable once signed, consistent with every other sign-off-type record in the platform.

4. Acceptance Criteria
A Change Request Log entry can be created at any tier, capturing request, rationale, and outcome.
For an Enterprise organization with approval workflows enabled, the Change Request Log view correctly displays existing ApprovalRequest records without creating any duplicate data.
A Deliverable Sign-off Sheet can be completed by an internal user (authenticated) or an external stakeholder (via a secure, reused token link), tied to a specific WBS deliverable, and is confirmed immutable once signed.
The external sign-off link mechanism is verified to be the exact same code path as Phase 11's Sprint 35 implementation, not a parallel reimplementation.

5. Non-Functional & Security Requirements
Requirement
Detail
No Duplication
Enterprise organizations' Change Request Log must never store a second copy of data already held in ApprovalRequest — it reads that data, it doesn't replicate it.
Tier-Aware Behavior
The distinction between Enterprise (reads ApprovalRequest) and other tiers (standalone log) must be correctly and reliably determined via Back Office's Sprint 29 tier-check function.
Immutability
Deliverable Sign-off records are append-only once completed, consistent with every other sign-off record in the platform.
Reuse
The external sign-off link must reuse Phase 11's existing token security pattern exactly — no second implementation of expiring, single-use external access tokens.


6. Implementation Task Breakdown: Sprint 41
[Phase 1: Change Request Log Schema] ──> [Phase 2: Tier-Aware Data Source Logic] ──> [Phase 3: Deliverable Sign-off Schema] ──> [Phase 4: Internal & External Sign-off Flows]

Phase 1: Change Request Log Schema
[ ] Task 1.1: Design public.change_request_log_entries (id, project_id, description, rationale, outcome, created_by_user_id, created_at) — used only for non-Enterprise-approval-workflow organizations.
Phase 2: Tier-Aware Data Source Logic
[ ] Task 2.1: Build the view/query logic that checks tier + approval-workflow-enabled status (via Sprint 29's checkFeatureAccess) and routes to either change_request_log_entries or a read of existing ApprovalRequest records accordingly.
Phase 3: Deliverable Sign-off Schema
[ ] Task 3.1: Design public.deliverable_signoffs (id, wbs_element_id, signed_by_type [internal_user/external], signed_by_reference, signed_at, conditions_notes).
Phase 4: Internal & External Sign-off Flows
[ ] Task 4.1: Build the internal, authenticated sign-off action.
[ ] Task 4.2: Wire the external sign-off flow to reuse Phase 11's Sprint 35 token mechanism directly — confirmed via code review to be the same shared function, not a copy.

7. Sprint Delivery Milestones
Milestone 1 — Change Request Log Schema Live (Target: Day 3) Schema deployed for non-Enterprise-workflow organizations.
Milestone 2 — Tier-Aware Logic Working (Target: Day 6) Enterprise organizations with approval workflows correctly see ApprovalRequest data; all others see the standalone log — verified against both cases directly.
Milestone 3 — Deliverable Sign-off Schema & Internal Flow Working (Target: Day 8) Internal sign-off action works correctly and is immutable once completed.
Milestone 4 — External Sign-off Reuse & Sprint Sign-Off (Target: Day 9) External sign-off correctly reuses Phase 11's token mechanism with no duplicate implementation; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Change Request Log visibility for Enterprise without workflows enabled: an Enterprise organization could technically have the tier but not have approval workflows turned on — should this case use the standalone log (like other tiers) or prompt them to enable the feature? Recommend defaulting to the standalone log whenever approval workflows aren't actively enabled, regardless of tier, since tier alone shouldn't force a different data model if the feature itself is off.
Deliverable Sign-off multiplicity: as flagged in Phase 11 and Phase 12's cross-sprint questions, should a single deliverable support multiple required signers? Recommend the same answer for consistency across the platform: yes, support multiple sign-off records per deliverable.
Change Request Log and Communication Plan interaction: should Change Request Log entries be one of the document types the Sprint 38 Communication Plan can route to specific stakeholders? Given Sprint 38's dynamic document-type registry design, this should already work automatically — worth an explicit verification test rather than assuming it, given how much this phase has emphasized not letting promised connections silently fail to materialize.

End of Sprint 41 PRD. Phase 2's tier-aware routing logic is the one piece of this sprint most likely to create real confusion if implemented sloppily — an Enterprise customer seeing two different, disconnected records of the same change request would be a worse outcome than not having this feature at all.
Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.

