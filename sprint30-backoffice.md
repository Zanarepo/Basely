Product Requirements Document (PRD)
Sprint 30: Back Office — Payment Processing & Checkout

1. Objective & Scope
The objective of Sprint 30 (backoffice) is to integrate real payment processing and build the subscription lifecycle: self-serve checkout, upgrade, downgrade, cancellation, and failed-payment (dunning) handling.
By the end of this sprint:
An organization admin can subscribe to Starter or Business tier through self-serve checkout
Upgrades, downgrades, and cancellations can be self-managed without support involvement
Enterprise tier follows a sales-assisted flow, not public checkout
Failed payments are retried and communicated before any access is restricted
Out of scope for this sprint: the internal back office UI for managing subscriptions manually (Sprint 31) and internal staff roles (Sprint 32) — though this sprint's data must be visible to both.
Hard dependency: This sprint requires Sprint 29's tier/subscription schema to exist — this sprint is what actually populates and transitions organization_subscriptions in response to real payment events.

2. User Stories
As an organization admin, I want to enter my payment details and subscribe to a paid tier, so that I can unlock the features my team needs.
As an organization admin, I want to upgrade, downgrade, or cancel my subscription myself, so that I don't have to contact support for routine billing changes.
As an organization admin, I want a clear notice if my payment fails, so that I have a chance to fix it before losing access.

3. Functional Requirements
3.1 Payment Processor Integration
Integrate a payment processor (Stripe recommended) for PCI-compliant payment handling, subscription billing, and invoicing.
No raw card data should ever be handled directly by platform servers — use the processor's hosted/tokenized fields exclusively.
3.2 Self-Serve Checkout
An admin can select Free, Starter, or Business tier, enter payment details, and activate a subscription without sales/support involvement.
3.3 Enterprise Sales-Assisted Flow
Enterprise tier is explicitly not self-serve — this sprint supports a manually-created subscription record (created by internal staff via Sprint 31's back office once built) rather than a public checkout path for this tier.
3.4 Self-Serve Tier Changes
Upgrade and downgrade between Free/Starter/Business, with immediate proration on upgrade per Sprint 29's decision.
3.5 Self-Serve Cancellation
An admin can cancel their subscription; access continues through the already-paid period, then reverts to Free tier — never full account deletion.
3.6 Dunning & Failed Payment Handling
On payment failure, retry per the processor's standard dunning schedule.
Notify the admin via Collaboration Layer's Sprint 17 notification infrastructure.
Restrict access only after a defined grace period has fully elapsed — never on first failure.

4. Acceptance Criteria
An organization admin can complete self-serve checkout for Starter or Business tier, with the processor correctly charging and the tier updating immediately on success.
Upgrading mid-cycle correctly prorates; downgrading takes effect per Sprint 29's timing decision.
Canceling reverts to Free tier only after the already-paid period ends, not immediately.
A failed payment triggers the defined retry/notification sequence and does not restrict access until the grace period fully elapses.

5. Non-Functional & Security Requirements
Requirement
Detail
PCI Compliance
Raw payment data must never touch platform servers directly — hosted/tokenized fields only.
Reliability
Payment processor webhook handling must be idempotent — a duplicate delivery must never double-charge or double-process a tier change.
Data Isolation
Billing data is strictly organization-scoped, restricted to Admin role within that organization.
Auditability
Every subscription state change is logged for both the organization's own record and the internal back office's future visibility (Sprint 31).


6. Implementation Task Breakdown: Sprint 30
[Phase 1: Payment Processor Integration] ──> [Phase 2: Self-Serve Checkout] ──> [Phase 3: Tier Changes & Cancellation] ──> [Phase 4: Dunning & Failure Handling]

Phase 1: Payment Processor Integration
Goal: Establish the foundational connection to the payment processor.
[ ] Task 1.1: Set Up Processor Account & API Integration


Configure the payment processor account, API keys, and webhook endpoint.
[ ] Task 1.2: Implement Webhook Verification & Idempotency


Verify webhook signatures; implement idempotency keys/checks so duplicate deliveries are safely ignored.
Phase 2: Self-Serve Checkout
Goal: Build the checkout experience for Free/Starter/Business.
[ ] Task 2.1: Build Tier Selection & Checkout UI


Use the processor's hosted payment fields (e.g., Stripe Elements) for card entry.
[ ] Task 2.2: Wire Checkout Success to Subscription Activation


On successful payment, update organization_subscriptions (Sprint 29) and trigger Sprint 29's feature-gate re-evaluation immediately.
Phase 3: Tier Changes & Cancellation
Goal: Let admins manage their own subscription lifecycle.
[ ] Task 3.1: Build Self-Serve Upgrade/Downgrade


Implement tier-change flows with correct proration.
[ ] Task 3.2: Build Cancellation Flow


Implement cancellation with correct end-of-period access retention before reverting to Free.
Phase 4: Dunning & Failure Handling
Goal: Handle payment failures gracefully and transparently.
[ ] Task 4.1: Configure Retry Schedule & Notifications


Configure the processor's dunning schedule; wire failure notifications through Sprint 17's infrastructure.
[ ] Task 4.2: Implement Grace-Period Access Restriction


Restrict access only after retries are fully exhausted and the grace period has elapsed.

7. Sprint Delivery Milestones
Milestone 1 — Processor Integration Live (Target: Day 3) Payment processor account configured; webhook verification and idempotency handling confirmed with test events.
Milestone 2 — Self-Serve Checkout Working (Target: Day 6) An admin can complete checkout for Starter/Business tier, with correct tier activation on success.
Milestone 3 — Tier Changes & Cancellation Working (Target: Day 9) Upgrade, downgrade, and cancellation all function correctly with proration and end-of-period access rules respected.
Milestone 4 — Dunning & Sprint Sign-Off (Target: Day 12) Failed payment retry, notification, and grace-period restriction all function correctly; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Grace period length: recommend 7–14 days, matching typical SaaS dunning norms and the chosen processor's default retry schedule — confirm the exact number before Task 4.2.
Enterprise contract billing: should Enterprise invoicing flow through the same processor (invoiced/net-30) or be handled entirely outside the platform? Recommend using the processor's invoicing feature even for Enterprise, so all billing data lives in one place for Sprint 31's reporting.
Refund handling: this sprint doesn't explicitly scope self-serve refunds — should refunds be entirely a manual back-office action (Sprint 31), or does self-serve need at least a partial-refund path for immediate post-purchase cancellations? Recommend manual-only via the back office for launch simplicity.

End of Sprint 30 PRD. This sprint is what turns Sprint 29's tier/feature model from a data structure into an actual revenue-generating subscription system — webhook idempotency (Task 1.2) is the detail most likely to cause a real billing incident if under-tested, since a duplicate webhook that isn't handled idempotently can silently double-charge a customer.
Development Requirements
Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
Ensure every interactive button uses the cursor: pointer style to clearly indicate that it is clickable.

