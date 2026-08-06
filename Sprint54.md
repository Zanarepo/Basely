Product Requirements Document (PRD)
Sprint 49: Back Office Maturity — Support & Compliance Tooling

1. Objective & Scope
The objective of Sprint 49 is to close the support-ticketing gap left open since Sprint 32, and build compliance tooling (data export/deletion, SOC 2 evidence, per-tenant backup) that becomes urgent the moment a real Enterprise deal requires it.
By the end of this sprint:
Support tickets are tied to tenant records and visible from the back office
Enterprise SLA breaches trigger alerts
Organizations can request a complete data export or formal deletion
SOC 2 evidence is collected automatically on a schedule
A single tenant can be backed up and restored independently of the whole platform
Out of scope for this sprint: any change to the ticketing system's own functionality, and ML-based SLA prediction.
Hard dependency: This sprint requires Sprint 31 (tenant detail view), Sprint 32 (Account Manager assignment), Sprint 23 (audit log pattern), Sprint 21 (SSO config as SOC 2 evidence), Sprint 22 (approval records as SOC 2 evidence), and Sprint 27's API for the data export mechanism.

2. User Stories
As a Support/Ops Admin, I want support tickets tied directly to tenant records, so I have full context without switching tools.
As an Enterprise PMO Director, I want an SLA I can hold the platform accountable to.
As an Enterprise customer's compliance team, I want to request a full data export or deletion.
As a Superadmin, I want SOC 2 evidence collected automatically from controls that already exist.

3. Functional Requirements
3.1 Support Ticket Integration
Link tickets from an external system to organization_id.
Ticket history visible directly from the tenant detail view (Sprint 31).
3.2 SLA Monitoring
Track ticket response/resolution against Enterprise SLA thresholds; breach alerting via Sprint 17.
3.3 Data Export (GDPR-Style)
Complete, structured per-organization export across every phase's data, reusing Sprint 27's API patterns internally.
3.4 Right-to-Be-Forgotten / Data Deletion
Formal, logged deletion flow with mandatory confirmation and a 30-day grace period before permanence.
Retains only legally-required records (e.g., billing); everything else removed.
Superadmin-gated.
3.5 SOC 2 Evidence Collection
Automated, scheduled compilation from Sprint 23's audit log, Sprint 21's SSO config, Sprint 22's approval records — weekly cadence plus on-demand generation.
3.6 Per-Tenant Backup/Restore
Distinct from platform-wide backups: a per-organization point-in-time backup/restore, isolated from every other tenant.

4. Acceptance Criteria
Support tickets linked to an organization are visible from the tenant detail view.
SLA breaches correctly trigger a notification to the assigned Account Manager within a defined delay.
A data export request produces a complete export verified against a full data-completeness checklist.
A deletion request requires confirmation, enters the grace period, is fully logged, and correctly retains only legally-required records after the grace period elapses.
SOC 2 evidence collection runs on schedule and produces a complete package without manual gathering.
A per-tenant restore correctly recovers one organization without affecting any other.

5. Non-Functional & Security Requirements
Requirement
Detail
Deletion Rigor
Same caution as Sprint 31's impersonation — explicit confirmation, full logging, grace period.
Auditability
Every export, deletion, and evidence-collection event extends Sprint 23's audit log pattern.
Data Isolation
Per-tenant backup/restore must never leak across tenant boundaries — needs explicit, separate isolation verification since backup operations often bypass normal RLS.


6. Implementation Task Breakdown: Sprint 49
[Phase 1: Ticket Integration & SLA] ──> [Phase 2: Data Export] ──> [Phase 3: Data Deletion] ──> [Phase 4: SOC 2 Evidence & Per-Tenant Backup]

Phase 1: Ticket Integration & SLA Monitoring
[x] Task 1.1: Integrate with the chosen ticketing system, linking tickets to organization_id.
[x] Task 1.2: Build SLA threshold tracking and breach alerting.
Phase 2: Data Export
[ ] Task 2.1: Build the complete per-organization export, reusing Sprint 27's API.
[ ] Task 2.2: Build a data-completeness verification checklist covering every phase.
Phase 3: Data Deletion
[ ] Task 3.1: Design public.deletion_requests (id, organization_id, requested_by, confirmed_at, grace_period_ends_at, executed_at, status).
[ ] Task 3.2: Build confirmation flow and 30-day grace period enforcement.
[ ] Task 3.3: Build retention-exception logic (billing preserved, everything else removed).
Phase 4: SOC 2 Evidence & Per-Tenant Backup
[ ] Task 4.1: Build scheduled evidence-collection job pulling from Sprints 21/22/23.
[ ] Task 4.2: Build per-tenant backup/restore with explicit isolation verification.

7. Sprint Delivery Milestones
Milestone 1 — Ticket Integration & SLA Live (Target: Day 3) Tickets visible from tenant detail view; SLA breach alerts firing correctly.
Milestone 2 — Data Export Working (Target: Day 6) Complete export verified against the data-completeness checklist.
Milestone 3 — Data Deletion Working (Target: Day 9) Deletion flow correctly enforces confirmation, grace period, and retention exceptions.
Milestone 4 — SOC 2 Evidence, Backup & Sprint Sign-Off (Target: Day 12) Evidence collection runs on schedule; per-tenant restore verified isolated; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Ticketing system choice: driven by actual support team tooling in use, confirm before Task 1.1.
Deletion grace period length: 30 days recommended as a starting default.
SOC 2 evidence cadence: weekly automated collection plus on-demand generation recommended.

End of Sprint 49 PRD. Task 3's deletion flow is the highest-stakes feature in this sprint — the grace period and retention-exception logic deserve the same scrutiny as any irreversible-action feature elsewhere in the platform.


## Development Requirements
- Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
- Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
- Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
- Ensure every interactive button uses the `cursor: pointer` style to clearly indicate that it is clickable.
-ensure you use our enterprise level drodpwon selections for all designs