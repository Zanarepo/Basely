Product Requirements Document (PRD)
Phase 11: Project Lifecycle & Closure Suite
Parent documents: PRD-ProjectManagement-Platform.md; PRD-Phase5-DocumentationEngine.md (Section 7.3, which originally deferred the Closeout Report pending exactly the lifecycle status this phase builds); PRD-Document-Library-Gap-Analysis.md (Section 7.2, which identified this as the single highest-leverage gap across the full document taxonomy) Version: 1.0 (Draft) Status: Draft for review Depends on: Foundation (project entity), Planning Core (schedule/WBS completion data), Cost Core (final budget/EVM data), Accountability Layer (risk register final status), and Documentation Engine's Sprint 12 templating engine, which this phase extends rather than replaces.

1. Purpose & Context
Five documents on your original list — Project Closure Report, Lessons Learned, Final Handover Document, Post-Implementation Review, and Client/Stakeholder Sign-off — have been sitting deferred since Documentation Engine's very first PRD, all blocked on the same missing piece: the platform has no concept of a project ever being "closed."
Every project entity built since Foundation's Sprint 1 has effectively lived in one implicit state: active. There's no field, no transition, no gate — a project just keeps existing, indefinitely open to schedule changes, budget edits, and RACI reassignment forever. This phase fixes that with one foundational addition (a lifecycle status field and its transition rules), and then builds the five closure-stage documents that become possible once it exists.
This is deliberately a small, high-leverage phase — one schema change unlocking five previously-blocked documents, not five independent problems.
This phase is split into three sprints:
[Sprint 33: Project Lifecycle Status Engine] ──> [Sprint 34: Closure Report & Lessons Learned] ──> [Sprint 35: Handover, Post-Implementation Review & Final Sign-off]

The lifecycle engine comes first because nothing else in this phase can exist without it — every closure document's core gating rule is "only generatable once the project has reached the right lifecycle status."

2. Goals for This Phase
Goal
Description
P11-G1
Give every project a formal lifecycle status (Initiating → Planning → Executing → Monitoring & Controlling → Closing → Closed), with controlled transitions
P11-G2
Auto-generate a Closure Report and Lessons Learned document once a project reaches Closing/Closed status, using data already captured across every prior phase
P11-G3
Build a Final Handover Document capturing deliverables and ongoing ownership for whoever inherits the project's outputs
P11-G4
Support a Post-Implementation Review, generated some time after closure, comparing actual outcomes against original objectives
P11-G5
Capture a real Client/Stakeholder Sign-off event — including from external stakeholders with no platform account — as the formal acceptance record closing out the project

Explicitly not goals for this phase: Quality Audit Reports (blocked on Phase 12's Quality Management Plan, which doesn't exist yet), and any change to how active (non-closing) projects behave — this phase adds a new terminal state, it does not change existing Planning Core/Cost Core/Accountability Layer behavior for projects still in earlier lifecycle stages.

3. Sprint 33: Project Lifecycle Status Engine
3.1 Objective & Scope
Add a formal lifecycle status to the project entity, with defined transitions, transition logging, and the gating logic every closure document in this phase will depend on.
3.2 User Stories
As a Project Manager, I want to formally mark my project's lifecycle stage, so that the platform (and my team) knows whether we're still planning, actively executing, or wrapping up.
As a Project Manager, I want closure-related actions to only become available once my project is genuinely closing, so that I'm not accidentally offered a Closure Report while the project is still mid-execution.
As an Enterprise PMO Director, I want every lifecycle transition logged, so that I have a clear record of when and by whom a project was formally closed.
3.3 Functional Requirements
Lifecycle status field: add lifecycle_status to the project entity, with values: Initiating, Planning, Executing, Monitoring & Controlling, Closing, Closed.
Transition rules: define which transitions are valid (e.g., forward-only through the standard sequence, with an explicit admin-override path for exceptional cases like an aborted/canceled project, rather than an unconstrained free-for-all).
Transition logging: every status change is logged with who made it, when, and (for closure specifically) a brief closure reason/summary.
Gating hook: expose the current lifecycle status as a condition other features can check — this phase's own closure documents (Sprints 34–35) are the first consumers, but the hook itself should be generic enough for future features (e.g., a future project archival feature) to use the same status field.
No behavior change for non-terminal statuses: Planning Core, Cost Core, and Accountability Layer continue to function exactly as before for any project in Initiating through Monitoring & Controlling — this sprint only adds new behavior at the Closing/Closed boundary.
3.4 Acceptance Criteria
A project's lifecycle status can be set and correctly follows the defined transition rules — an invalid transition (e.g., Closed directly back to Executing without an explicit override) is rejected with a clear message.
Every transition is logged with actor, timestamp, and status change, retrievable later.
A project not yet in Closing/Closed status correctly has no access to any Sprint 34/35 closure document generation option.
Existing Planning Core/Cost Core/Accountability Layer functionality is verified unchanged for projects in any non-terminal status (explicit regression check).
3.5 Non-Functional & Security Requirements
Requirement
Detail
Data Integrity
Transition rules must be enforced at the API layer, not just the UI — the same principle applied to every gating mechanism elsewhere in this platform (feature tiers, approval workflows).
Auditability
Lifecycle transitions, especially closure, should be logged with the same rigor as other significant project events — reuse the Collaboration Layer's Sprint 18 activity log pattern.
Backward Compatibility
This sprint must not alter any existing behavior for projects that haven't reached Closing/Closed — verified by explicit regression testing against Phases 2–9.

3.6 Implementation Task Breakdown
[Phase 1: Lifecycle Schema] ──> [Phase 2: Transition Rules & Enforcement] ──> [Phase 3: Transition Logging] ──> [Phase 4: Gating Hook & Regression Validation]

[ ] Task 1.1: Add lifecycle_status enum field to the projects table.
[ ] Task 1.2: Define the valid transition graph (standard forward sequence + explicit override path).
[ ] Task 2.1: Build the transition-check function, enforced at the API layer for any status-change request.
[ ] Task 2.2: Build the lifecycle status UI control (visible on the project dashboard from Reporting Layer's Sprint 19).
[ ] Task 3.1: Log every transition with actor, timestamp, and (for closure) a closure reason field.
[ ] Task 4.1: Build the generic isProjectAtLifecycleStage(project_id, stage) check other features call.
[ ] Task 4.2: Run a full regression suite against Phases 2–9 for non-terminal-status projects.
3.7 Open Questions
Override governance: should moving a project directly to Closed (skipping intermediate stages, e.g., a canceled project) require the same approval-workflow pattern as Administration & Governance's Sprint 22, or is a single Admin action with a mandatory reason sufficient? Recommend single-action-with-reason for now, consistent with this phase's lightweight approach, escalating to a formal approval only if misuse becomes a real concern.
Reopening a closed project: should this ever be possible (e.g., a client requests post-closure rework), or is Closed genuinely terminal? Recommend allowing a reopen action restricted to Admin, logged clearly as an exception, rather than making Closed an absolute dead end.

4. Sprint 34: Closure Report & Lessons Learned
4.1 Objective & Scope
Build the first two closure documents using Documentation Engine's existing Sprint 12 templating engine, gated on Sprint 33's lifecycle status.
4.2 User Stories
As a Project Manager, I want a Closure Report auto-generated from my project's final schedule, budget, and deliverable data, so that I don't have to manually compile a summary of everything that already lives in the system.
As a Project Manager, I want to capture lessons learned in a structured document, so that future projects can benefit from what worked and what didn't on this one.
4.3 Functional Requirements
Closure Report, generatable only once lifecycle_status is Closing or Closed:
Data-bound: final schedule status (completed vs. planned dates, variance), final budget/EVM figures at closure (CV, SV, final CPI/SPI, EAC vs. actual), deliverables completed (from WBS work packages), risk register final status (open vs. closed/mitigated risks).
Free-text: closure summary/statement.
Lessons Learned, generatable at the same gate:
Data-bound: minimal (project name, dates, methodology) for context.
Free-text (the bulk of the document): what worked, what didn't, recommendations for future projects — structured as prompted sections, not a single open text box, to encourage genuinely useful input rather than a one-line summary.
Reuse, not reinvention: both documents use Documentation Engine's existing templating structure (DocumentTemplate/GeneratedDocument) exactly as built in Sprint 12 — this sprint adds two new document_type values and their section resolvers, nothing more.
4.4 Acceptance Criteria
Attempting to generate either document before a project reaches Closing/Closed status is blocked with a clear message referencing the required lifecycle stage.
A Closure Report generated for a completed project correctly reflects final schedule variance, final EVM figures, and deliverable completion status, matching the underlying Planning Core/Cost Core/Accountability Layer data exactly.
Lessons Learned's structured free-text sections are all present and independently editable, consistent with the free-text persistence guarantee established in Sprint 12.
4.5 Implementation Task Breakdown
[Phase 1: Template Definitions] ──> [Phase 2: Closure Report Data Resolvers] ──> [Phase 3: Lessons Learned Structure] ──> [Phase 4: Lifecycle Gating Integration]

[ ] Task 1.1: Define document_type = 'closure_report' and 'lessons_learned' templates using Sprint 12's existing schema.
[ ] Task 2.1: Build resolvers pulling final schedule variance, final EVM figures, and deliverable/risk status.
[ ] Task 3.1: Build the structured free-text prompts for Lessons Learned (what worked / what didn't / recommendations).
[ ] Task 4.1: Wire both document types to check Sprint 33's lifecycle gate before allowing generation.
4.6 Open Questions
Regeneration behavior after closure: since these documents are generated at/after Closing, and a project shouldn't meaningfully change after Closed, should they behave like Sprint 12's always-current documents, or like Sprint 14's frozen Status Report snapshots? Recommend snapshot behavior (frozen at generation time) — a Closure Report shouldn't silently change if, say, a very late actual cost gets entered after the fact.

5. Sprint 35: Handover, Post-Implementation Review & Final Sign-off
5.1 Objective & Scope
Build the remaining three closure-stage artifacts: a Final Handover Document, a Post-Implementation Review (generated some time after closure), and a real Client/Stakeholder Sign-off capture mechanism — including support for external stakeholders with no platform account.
5.2 User Stories
As a Project Manager, I want a handover document summarizing deliverables and ongoing ownership, so that whoever inherits this project's outputs has a clear reference.
As a Project Manager, I want to conduct a post-implementation review some weeks or months after closure, so that I can honestly assess outcomes once the dust has settled, not just at the moment of handoff.
As a Project Manager, I want to capture formal sign-off from my client or key stakeholder, so that project closure has a real acceptance record, not just an internal status change.
As an external client with no platform account, I want to review and formally accept project closure via a simple link, so that I'm not required to create an account just to approve a project I'm paying for.
5.3 Functional Requirements
Final Handover Document:
Data-bound: completed deliverables (from WBS), current RACI ownership for anything ongoing (support contacts, maintenance owners), open items carried forward.
Free-text: operational instructions, support/escalation contacts, transition notes.
Post-Implementation Review:
Generatable only when lifecycle_status = Closed, and explicitly supports being generated on a delay — a PM picks a review date (e.g., 30/60/90 days post-closure), not necessarily the closure date itself.
Data-bound: original objectives (from the Project Charter, Sprint 12) compared against actual final outcomes (schedule/cost/deliverable data, same sources as the Closure Report).
Free-text: outcome assessment, recommendations.
Note: full "actual ROI vs. planned ROI" comparison would benefit from Phase 12's Business Case (not yet built) — this sprint compares against what the Charter already captures, and should be designed so Phase 12's Business Case can be added as an additional data-bound source later without restructuring this document type.
Client/Stakeholder Sign-off:
Capture a real acceptance event: who signed off, when, and against which version of the Closure Report/deliverables.
Support signing by an internal platform user (standard authenticated action) and by an external stakeholder with no platform account, reusing the token-based external-access pattern already established in Foundation's Sprint 1 invitation flow (a secure, expiring link that lets someone act without logging in).
A signed-off record is immutable once captured — the same "no silent edits to a compliance-relevant record" principle used for governance audit logs.
5.4 Acceptance Criteria
A Final Handover Document correctly lists completed deliverables and current ownership, generatable once the project is Closing/Closed.
A Post-Implementation Review can be generated on a PM-selected date after closure, correctly comparing Charter objectives against final outcome data.
An external stakeholder can access a sign-off link without a platform account, review the closure summary, and formally accept — with the resulting sign-off record correctly immutable afterward.
An internal platform user can equally complete sign-off through an authenticated in-app action, with both paths producing an equivalent, equally valid sign-off record.
5.5 Non-Functional & Security Requirements
Requirement
Detail
Security (external sign-off link)
The token-based external sign-off link must be single-use or time-expiring, consistent with the security model already established for Foundation's invitation tokens — it must not remain a permanently valid, guessable URL.
Immutability
A completed sign-off record must be append-only — no update path, mirroring the governance audit log's structural enforcement from Administration & Governance's Sprint 23.
Data Isolation
Handover and PIR documents inherit the same project-scoped RLS pattern as every other document type; the external sign-off link is the one deliberate, narrowly-scoped exception allowing unauthenticated access, limited strictly to that single sign-off action.

5.6 Implementation Task Breakdown
[Phase 1: Handover Document] ──> [Phase 2: Post-Implementation Review] ──> [Phase 3: Sign-off Data Model & Internal Flow] ──> [Phase 4: External Sign-off Link]

[ ] Task 1.1: Define the Handover document template and data resolvers (deliverables, ongoing ownership, open items).
[ ] Task 2.1: Build the delayed-generation mechanism for PIR (PM selects a review date, not forced to closure date).
[ ] Task 2.2: Build the Charter-objectives-vs-outcome comparison resolver, structured to accept a future Business Case data source without redesign.
[ ] Task 3.1: Design public.project_signoffs (id, project_id, signed_by_type [internal_user/external], signed_by_reference, signed_at, closure_report_reference).
[ ] Task 3.2: Build the internal, authenticated sign-off action.
[ ] Task 4.1: Build the external, token-based sign-off link, reusing Foundation's invitation-token security pattern.
[ ] Task 4.2: Enforce immutability on project_signoffs at the database permission level.
5.7 Open Questions
Multiple required sign-offs: does project closure ever require sign-off from more than one stakeholder (e.g., both a client and an internal sponsor), or is a single sign-off record sufficient for launch? Recommend supporting multiple sign-off records per project (not exclusive), with closure considered fully accepted once all designated required signers have signed — simpler single-signer flow acceptable if no immediate customer need for multi-party sign-off exists.
PIR follow-up reminders: should the platform proactively remind a PM to conduct a PIR at a chosen future date (using Collaboration Layer's Sprint 17 notifications), or is this entirely PM-initiated with no prompting? Recommend a reminder notification, since a PIR scheduled 90 days out is exactly the kind of thing that gets forgotten without a nudge.
Handover document ongoing ownership source: once a project is Closed, does RACI data (Sprint 10) still make sense as the source for "ongoing owner," or does closure need its own lightweight concept of a post-project support contact, separate from active-project RACI roles? Recommend reusing RACI data as-is for this phase's launch scope, revisiting only if real usage shows the distinction matters.

6. Cross-Sprint Requirements
6.1 Non-Functional Requirements (Phase-Wide)
Category
Requirement
Backward Compatibility
Nothing in this phase changes behavior for any project not yet in Closing/Closed status — verified by explicit regression testing in Sprint 33.
Consistency
All three sprints' documents reuse Documentation Engine's Sprint 12 templating engine exactly — no new document-rendering pipeline is introduced anywhere in this phase.
Auditability
Lifecycle transitions and sign-off events are both immutable, logged records — this phase extends the platform's existing "audit trail is structural, not conventional" principle to project closure specifically.

6.2 Out of Scope for This Phase
Quality Audit Reports — blocked on Phase 12's Quality Management Plan, which doesn't exist yet.
Automatic project archival/read-only lockdown on Closed — this phase adds the status field and closure documents, but doesn't change what remains editable on a Closed project; that's a reasonable future hardening step once real usage shows whether it's needed.
Formal ROI realization tracking (planned ROI from a Business Case vs. actual) — the Post-Implementation Review in this phase compares against Charter objectives only, since Business Case doesn't exist until Phase 12; this sprint's PIR resolver is explicitly designed to accept that data source later without restructuring.

7. Success Criteria for Phase Completion
Every project can be assigned a lifecycle status, with valid transitions enforced and every transition logged.
Closure Report, Lessons Learned, Final Handover Document, Post-Implementation Review, and Client/Stakeholder Sign-off are all generatable once a project reaches the appropriate lifecycle stage, using Documentation Engine's existing templating engine.
External stakeholders can complete sign-off without a platform account, via a secure, time-limited link.
All five previously-deferred closure documents move from ⬜/blocked to ✅ in the Document Library Gap Analysis.

End of Phase 11 PRD. This is the highest-leverage phase in the post-launch roadmap: one schema addition (lifecycle status) directly unblocks five documents that have been sitting deferred since Documentation Engine's original scope. Recommend this phase — along with the Stakeholder Register/Risk Register document fast-follow — take priority over Phases 12–13, both of which require entirely new data models with no existing shortcuts.

