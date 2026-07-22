Product Requirements Document (PRD)
Sprint 21: Administration & Governance — Single Sign-On (SSO)

1. Objective & Scope
The objective of Sprint 21 is to build SAML and OAuth-based SSO, letting enterprise organizations authenticate their users through their own identity provider rather than the platform-native email/password flow built in Foundation.
By the end of this sprint, an organization admin will be able to:
Configure SAML or OAuth SSO for their organization
Have their users redirected to their identity provider and logged in automatically upon success
Retain a break-glass path so a misconfigured IdP can't permanently lock the organization out
Out of scope for this sprint: SCIM-based automated user provisioning/deprovisioning (explicitly deferred per the parent Phase 8 PRD) and approval workflows (Sprint 22).
Hard dependency: This sprint directly extends Foundation's (Sprint 1) authentication layer — profiles, organization_members, and the existing Supabase Auth session handling. This is the riskiest sprint in the phase to get wrong, since a mistake here affects every user's ability to log in at all, not just a feature within the app.

2. User Stories
As an Enterprise PMO Director, I want my organization's users to log in via our existing identity provider, so that we can enforce our own password/MFA policies and de-provision access centrally when someone leaves.
As an IT Administrator, I want to configure SSO for my organization once, so that every user in my organization authenticates consistently without individual platform credentials to manage.
As a platform user in an SSO-enabled organization, I want to be redirected to my company's login page automatically, so that I don't need to remember a separate password for this platform.

3. Functional Requirements
3.1 SAML 2.0 Support
An organization admin can configure a SAML identity provider: IdP metadata (entity ID, SSO URL), signing certificate, and attribute mapping (which IdP attributes map to name/email).
3.2 OAuth Support
An organization admin can configure OAuth-based SSO as an alternative to SAML, for organizations whose identity infrastructure is better suited to OAuth.
3.3 Per-Organization Scoping
SSO configuration is scoped strictly to a single organization — enabling or configuring SSO for one organization must have zero effect on any other organization's authentication.
3.4 Fallback / Coexistence
Support at least one break-glass path (e.g., a designated admin account) that can still authenticate via native email/password even when SSO is enforced for the rest of the organization, so a misconfigured IdP can't fully lock the organization out.
3.5 Attribute Mapping into Existing Structures
Map IdP-provided name/email (and optionally role/group, if the IdP provides it) into the existing profiles/organization_members tables from Foundation — no new, parallel user-identity structure should be introduced.

4. Acceptance Criteria
A user in an SSO-configured organization is correctly redirected to their identity provider and, upon successful authentication, is logged into the platform with correctly mapped profile data.
SSO configuration for one organization has zero effect on authentication for any other organization on the platform, verified with a multi-organization test.
A misconfigured or failed SSO attempt (e.g., invalid certificate, unreachable IdP) produces a clear, actionable error rather than a silent failure or generic platform error.
The designated break-glass admin account can still authenticate via native login even when SSO is enforced for the organization.

5. Non-Functional & Security Requirements
Requirement
Detail
Security
SSO configuration must be restricted to organization Admin role only — this is among the highest-privilege settings in the platform, since misconfiguration affects every user's ability to authenticate.
Data Isolation
sso_configurations must be strictly organization-scoped; no cross-organization read or write access.
Reliability
A break-glass authentication path must exist and be tested, so a misconfigured or unreachable IdP cannot result in a complete organizational lockout.
Auditability
Every SSO configuration change must be logged in the governance audit trail (Sprint 23) — this sprint should emit the log event even though the dedicated audit log table is built in a later sprint (log to the general activity log as an interim measure if Sprint 23 hasn't shipped yet, then migrate).


6. Implementation Task Breakdown: Sprint 21
[Phase 1: SSO Schema & Security] ──> [Phase 2: SAML Implementation] ──> [Phase 3: OAuth Implementation] ──> [Phase 4: Break-Glass & Attribute Mapping]
Phase 1: SSO Schema & Security
Goal: Provision the configuration table and lock down who can touch it.
Task 1.1: Design SSO Configuration Schema
Create a SQL migration for public.sso_configurations (id, organization_id, protocol enum [saml/oauth], idp_metadata, certificate, attribute_mapping [JSON], enforced boolean).
Task 1.2: Restrict Configuration Access
Enforce that only organization Admin role can read/write sso_configurations — stricter than the platform's general Admin/PM write pattern used elsewhere.
Phase 2: SAML Implementation
Goal: Build the SAML authentication flow.
Task 2.1: Build SAML Configuration UI
Admin-facing form for entering IdP metadata, certificate, and attribute mapping.
Task 2.2: Implement SAML Login Flow
Build the redirect-to-IdP, assertion-validation, and session-creation flow, integrating with the existing Supabase Auth session pattern from Foundation.
Phase 3: OAuth Implementation
Goal: Build the OAuth authentication flow as an alternative to SAML.
Task 3.1: Build OAuth Configuration UI
Admin-facing form for OAuth provider configuration.
Task 3.2: Implement OAuth Login Flow
Build the OAuth redirect/callback flow, integrating with existing session handling.
Phase 4: Break-Glass & Attribute Mapping
Goal: Ensure organizations can't lock themselves out, and that IdP data maps cleanly into existing structures.
Task 4.1: Implement Break-Glass Admin Path
Build and test a native-login fallback for at least one designated admin account per organization, functioning even when enforced = true.
Task 4.2: Implement Attribute Mapping
Map IdP name/email/role attributes into profiles/organization_members, handling first-login provisioning (a new SSO user's first login should correctly create their profiles/organization_members records, not just fail because no account exists yet).
Task 4.3: Build Clear Error Handling
Ensure SSO failures (bad certificate, unreachable IdP, attribute mapping mismatch) produce specific, actionable error messages rather than generic failures.

7. Sprint Delivery Milestones
Milestone 1 — SSO Schema & Access Control Live (Target: Day 3) sso_configurations table deployed, restricted to organization Admin role only.
Milestone 2 — SAML Flow Working (Target: Day 7) A test organization can configure SAML and successfully authenticate a user through it, with correctly mapped profile data.
Milestone 3 — OAuth Flow Working (Target: Day 9) A test organization can configure OAuth and successfully authenticate a user through it.
Milestone 4 — Break-Glass, Error Handling & Sprint Sign-Off (Target: Day 12) Break-glass admin login verified functional even with SSO enforced; misconfiguration scenarios produce clear errors; all Section 4 acceptance criteria pass. Given this sprint's risk profile, sign-off should include a deliberate "what happens if this goes wrong in production" review, not just passing tests.

8. Open Questions Carried Into This Sprint
Break-glass scope: should exactly one designated admin per organization retain native login, or should this be configurable (e.g., a specific list of break-glass accounts)? Recommend starting with a simple single-designated-admin model for launch simplicity.
First-login provisioning: when a new user authenticates via SSO for the first time, should they be auto-provisioned into the organization with a default role, or does an existing admin need to pre-authorize them? Auto-provisioning is more convenient but has security implications (anyone who can authenticate via the IdP gets platform access); recommend requiring pre-authorization (an existing organization_members invite or pre-approval) unless the organization explicitly opts into auto-provisioning.
Supported IdP list: are there specific identity providers (Okta, Azure AD, Google Workspace, etc.) that need explicit testing/certification for launch, or is generic SAML/OAuth support sufficient? Worth confirming against actual early enterprise customer requirements rather than guessing.
MFA delegation: does the platform need to do anything special to support IdP-enforced MFA, or is this entirely transparent since MFA happens at the IdP before the SAML/OAuth assertion is ever received? Likely fully transparent, but worth an explicit confirmation during implementation.

End of Sprint 21 PRD. This sprint's break-glass and attribute-mapping decisions are the ones most likely to cause real production incidents if under-specified — recommend treating Section 8's open questions as blocking, not just "nice to resolve," given how much trust an enterprise customer is placing in this specific sprint.
Instruction: Make sure you create separate file for hooks and logics, modularize it and make it both mobile, ipad and desktop responsive 

