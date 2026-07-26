Product Requirements Document (PRD)
Sprint 27: Integrations — Public API & Webhooks

1. Objective & Scope
The objective of Sprint 27 is to build a public REST API and webhook system, giving customers and partners the ability to build their own integrations against the platform — and providing the general-purpose infrastructure Sprint 28's ERP connector will build directly on top of, rather than as a separate, bespoke integration pipeline.
By the end of this sprint, an organization admin will be able to:
Generate and manage scoped API keys for their organization
Give external developers documented, authenticated access to core platform data
Register webhooks that fire on key platform events
Out of scope for this sprint: any specific third-party connector (Sprint 28 builds the first one, using this sprint's infrastructure) and a public integration marketplace/directory (explicitly deferred per the parent Phase 9 PRD).
Hard dependency: This sprint has no dependency on Sprints 25–26, but Sprint 28 has a hard dependency on this sprint. This is the piece of infrastructure the rest of the phase's extensibility story depends on — get the versioning and security model wrong here and every future integration inherits that mistake.

2. User Stories
As a customer's internal developer, I want a documented REST API, so that I can pull project data into our own internal tools without waiting for the platform vendor to build a specific integration for us.
As a customer's internal developer, I want to subscribe to webhooks for key events, so that our systems can react in near-real-time to changes in the platform rather than polling constantly.
As an Enterprise PMO Director, I want to manage API keys/access for my organization, so that I control which external systems can read or write our data.

3. Functional Requirements
3.1 REST API
Expose read (and write, where sensible) access to core entities: projects, WBS, schedule/activities, budget/EVM data, RACI assignments, and risks.
Follow standard REST conventions (resource-based URLs, standard HTTP methods and status codes).
Authenticate every request via an API key.
3.2 API Key Management
An organization admin can generate, view, and revoke API keys.
Each key has a defined scope: read-only or read-write, and which entity types it can access.
Revoking a key takes effect immediately.
3.3 Webhooks
Support registering a webhook (target URL + subscribed event type) for key events: baseline saved, risk status changed, document generated, and others as reasonable given existing trigger infrastructure.
Reuse the trigger_type-style event architecture already established in Collaboration Layer's Sprint 17 notification system where the underlying event already exists, rather than building a second, disconnected event-detection mechanism.
Sign webhook payloads (e.g., HMAC signature header) so receiving systems can verify authenticity.
3.4 Rate Limiting
Apply reasonable, clearly communicated rate limits per API key (e.g., via response headers indicating remaining quota).
3.5 API Documentation
Publish developer-facing documentation covering authentication, available endpoints, request/response formats, and webhook event types/payload structure.

4. Acceptance Criteria
A generated API key can successfully authenticate and read project data via the REST API, respecting its configured read-only or read-write scope.
Revoking an API key immediately and completely blocks further API access using that key.
A registered webhook correctly fires for its subscribed event type within a target delivery window of under 1 minute, with a valid signature that a receiving system can verify.
Published API documentation accurately covers every available endpoint and webhook event type, verified by an independent developer successfully building a simple integration using only the published docs.

5. Non-Functional & Security Requirements
Requirement
Detail
Security
API keys must be stored hashed (never plaintext) and never displayed again after initial generation (standard practice: show once, then only a masked reference). Webhook payloads must be signed.
Data Isolation
An API key's access must be strictly scoped to its owning organization and configured entity/permission scope — no key should ever be able to access another organization's data under any circumstance.
Versioning
The API must have an explicit versioning strategy (e.g., URL-based /v1/) decided before launch — this must not be an afterthought, since breaking changes after external developers integrate are far more disruptive than deciding this upfront.
Reliability
Webhook delivery failures must be retried with reasonable backoff (e.g., exponential retry over a bounded window), not dropped after a single failed attempt.
Auditability
API key creation and revocation must be logged in the governance audit log (Administration & Governance's Sprint 23), since key management is an access-control-adjacent action.


6. Implementation Task Breakdown: Sprint 27
[Phase 1: API Key Schema & Auth] ──> [Phase 2: Core REST Endpoints] ──> [Phase 3: Webhook Infrastructure] ──> [Phase 4: Rate Limiting & Documentation]

Phase 1: API Key Schema & Authentication
Goal: Build the foundational key management and request authentication layer.
[ ] Task 1.1: Design API Key Schema


Create a SQL migration for public.api_keys (id, organization_id, key_hash, scope enum [read_only/read_write], entity_scope [array], created_by_user_id, revoked_at [nullable]).
[ ] Task 1.2: Implement Key Generation & Hashing


Build key generation (shown once to the admin, stored hashed thereafter) and revocation actions.
[ ] Task 1.3: Build Request Authentication Middleware


Implement API request authentication, resolving a key to its organization and scope, rejecting requests with a revoked or invalid key.
[ ] Task 1.4: Log Key Management to Governance Audit Log


Wire key creation/revocation events into Administration & Governance's Sprint 23 audit log.
Phase 2: Core REST Endpoints
Goal: Expose the core entities via versioned, documented endpoints.
[ ] Task 2.1: Define API Versioning Strategy


Decide and implement the versioning approach (recommend URL-based /v1/) before building any endpoints on top of it.
[ ] Task 2.2: Build Read Endpoints


Implement read access to projects, WBS, schedule/activities, budget/EVM data, RACI assignments, and risks, respecting each key's entity_scope.
[ ] Task 2.3: Build Write Endpoints Where Appropriate


Implement write access for entities where external write makes sense (e.g., actual cost ingestion, directly relevant to Sprint 28), respecting read_write scope.
Phase 3: Webhook Infrastructure
Goal: Build subscription management and reliable, signed delivery.
[ ] Task 3.1: Design Webhook Subscription Schema


Create a SQL migration for public.webhook_subscriptions (id, organization_id, event_type, target_url, created_by_user_id, active).
[ ] Task 3.2: Build Webhook Dispatch


Implement dispatch logic reusing existing event/trigger sources where they already exist (Sprint 17's architecture), with HMAC payload signing.
[ ] Task 3.3: Implement Retry Logic


Build retry-with-backoff for failed webhook deliveries, with a bounded maximum retry window.
Phase 4: Rate Limiting & Documentation
Goal: Protect platform stability and make the API genuinely usable by external developers.
[ ] Task 4.1: Implement Rate Limiting


Apply per-key rate limits with clear response headers indicating remaining quota.
[ ] Task 4.2: Publish API Documentation


Write and publish developer-facing documentation covering authentication, endpoints, request/response formats, and webhook payloads.
[ ] Task 4.3: Validate Documentation Against an Independent Build


Have someone not involved in building the API attempt a simple integration using only the published docs, to catch documentation gaps before external customers do.

7. Sprint Delivery Milestones
Milestone 1 — API Key Infrastructure Live (Target: Day 3) Key generation, hashing, authentication middleware, and revocation all working; key management logged to the governance audit log.
Milestone 2 — Core Endpoints Live (Target: Day 7) Versioned read (and appropriate write) endpoints functioning correctly for all core entities, respecting scope restrictions.
Milestone 3 — Webhooks Working (Target: Day 10) Webhook subscriptions fire correctly and reliably, with signed payloads and working retry logic.
Milestone 4 — Rate Limiting, Documentation & Sprint Sign-Off (Target: Day 12) Rate limiting is functioning and clearly communicated; documentation is published and validated by an independent build exercise; all Section 4 acceptance criteria pass — this is the foundation Sprint 28 builds directly on top of, so sign-off should be held to a high bar.

8. Open Questions Carried Into This Sprint
API versioning strategy specifics: URL-based (/v1/), header-based, or another approach? Recommend URL-based for its simplicity and transparency to integrating developers — but this must be an explicit decision made before Task 2.1, not an implicit default.
Write endpoint scope: beyond actual cost ingestion (needed for Sprint 28), which other entities should support external write access at launch — RACI assignments, risk updates, comments? Recommend starting conservative (read-heavy, with write limited to what Sprint 28 explicitly needs) and expanding based on real customer/partner demand rather than speculative scope.
Webhook event type list: which specific events should be available at launch beyond the three examples in Section 3.3? Recommend defining this list explicitly against actually-existing trigger sources (Sprint 17's mention notifications, baseline saves, risk status changes) rather than promising events the platform doesn't yet generate.
API key permission granularity: is organization-wide, entity-type-level scope (Section 3.2) sufficient, or do some customers need project-level API key scoping? Recommend organization-wide scope for launch simplicity, with project-level scoping as a future refinement if requested.

End of Sprint 27 PRD. This sprint is the load-bearing infrastructure for the rest of the Integrations phase's extensibility story — Sprint 28's ERP connector, and any future customer-built integration, both depend on the versioning, security, and reliability decisions made here holding up under real external use.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

