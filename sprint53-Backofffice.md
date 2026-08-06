Product Requirements Document (PRD)
Sprint 48: Back Office Maturity — Analytics & Retention Intelligence

1. Objective & Scope
The objective of this  Sprint  is to build the predictive layer Phase 10's back office never had: cohort/retention analysis, churn risk scoring, LTV, revenue forecasting, and automated win-back campaigns.
By the end of this sprint, a Superadmin or Account Manager will be able to:
See retention curves by signup cohort and tier
See an explainable churn risk signal on any organization
See LTV and a forward-looking revenue forecast with visible assumptions
Have canceled subscriptions automatically enter a win-back notification sequence
Out of scope for this sprint: any ML-based scoring model (rules-based only) and support-ticket-derived signals (Sprint 49 hasn't shipped yet — this sprint's churn model should be designed to accept that signal later without restructuring).
Hard dependency: This sprint requires Back Office's Sprint 29/30 (subscription and billing data) and Sprint 32 (Account Manager scoping). It reuses Reporting Layer's Sprint 19/20 widget architecture and Collaboration Layer's Sprint 17 notification infrastructure.

2. User Stories
As a Superadmin/Executive, I want cohort retention analysis, so that I can see how customer behavior changes based on when they signed up.
As a Superadmin, I want churn risk signals on individual accounts, so that intervention can happen before a customer actually cancels.
As a Superadmin, I want revenue forecasting, so that business planning isn't based purely on trailing MRR.
As an organization admin whose payment has failed, I want an automated win-back sequence, so my lapsed subscription has a real chance of recovering.

3. Functional Requirements
3.1 Cohort Retention Analysis
Group organizations by signup month and tier; track retention (still-active %) over subsequent months.
Rendered as a dashboard widget reusing Sprint 19/20's architecture.
3.2 Churn Risk Scoring
Rules-based signal per organization, combining: login recency/frequency, feature adoption depth, and payment history.
Score and its contributing signals are both visible — a Superadmin must be able to see why an organization scored as it did.
Designed to accept an additional signal (support ticket volume) once Sprint 49 ships, without restructuring the model.
3.3 LTV Calculation
Per-organization and per-cohort, calculated from actual billing history — not a static or assumed figure.
3.4 Revenue Forecasting
Forward-looking MRR/ARR projection based on current subscription state and historical churn rate.
Displayed as a range, with underlying assumptions visible in the UI.
3.5 Automated Win-Back Campaigns
Extends Sprint 30's dunning sequence: after full cancellation, a scheduled notification sequence via Sprint 17's infrastructure.
3.6 Account Manager Integration
Churn risk signals for an Account Manager's assigned accounts surface directly in their existing Sprint 32 scoped view.

4. Acceptance Criteria
Cohort retention curves render correctly, matching underlying subscription data exactly.
Churn risk scores calculate consistently, with every contributing signal visible and inspectable.
LTV and revenue forecast figures are traceable to actual billing data; the forecast displays as a range with visible assumptions.
A canceled subscription correctly enters the win-back sequence per schedule.
An Account Manager sees churn signals for assigned accounts directly within their Sprint 32 view.

5. Non-Functional & Security Requirements
Requirement
Detail
Explainability
Churn scoring must remain rules-based and fully inspectable for this sprint.
Data Isolation
Analytics views respect Sprint 31 (platform-wide) vs. Sprint 32 (assigned-accounts-only) scoping exactly.
Performance
Cohort/forecast calculations pre-computed on a scheduled cadence, not live on every dashboard load.


6. Implementation Task Breakdown: Sprint 48
[Phase 1: Cohort Retention] ──> [Phase 2: Churn Risk Scoring] ──> [Phase 3: LTV & Forecasting] ──> [Phase 4: Win-Back & AM Integration]

Phase 1: Cohort Retention Analysis
[ ] Task 1.1: Build the cohort grouping/retention-curve calculation.
[ ] Task 1.2: Build the dashboard widget reusing Sprint 19/20's architecture.
Phase 2: Churn Risk Scoring
[ ] Task 2.1: Design public.churn_risk_scores (id, organization_id, score, contributing_signals [JSON], calculated_at).
[ ] Task 2.2: Build the rules-based scoring calculation with an extensible signal list.
[ ] Task 2.3: Build the score detail UI showing contributing signals.
Phase 3: LTV & Forecasting
[ ] Task 3.1: Build LTV calculation from actual billing history.
[ ] Task 3.2: Build the revenue forecast model, displayed as a range with visible assumptions.
Phase 4: Win-Back & Account Manager Integration
[ ] Task 4.1: Build the win-back notification sequence, triggered on full cancellation.
[ ] Task 4.2: Wire churn risk signals into Sprint 32's Account Manager scoped view.

7. Sprint Delivery Milestones
Milestone 1 — Cohort Retention Live (Target: Day 3) Retention curves render correctly by cohort and tier.
Milestone 2 — Churn Scoring Live (Target: Day 6) Scores calculate consistently with fully inspectable contributing signals.
Milestone 3 — LTV & Forecasting Live (Target: Day 8) Both figures traceable to billing data; forecast shown as a range with assumptions.
Milestone 4 — Win-Back, AM Integration & Sprint Sign-Off (Target: Day 10) Win-back sequence fires correctly; Account Manager view surfaces churn signals; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Signal weighting: needs input from whoever owns customer success — recommend starting with equally-weighted login recency, feature adoption, and payment history, iterating with real outcome data.
Forecast range width: recommend a simple historical-variance-based range for this sprint, refined later with more data.

End of Sprint 48 PRD. Task 2.2's extensible signal design is the detail most worth protecting — Sprint 49 will want to add support-ticket volume as a churn signal, and this sprint's scoring model needs to accept that without a rebuild.


## Development Requirements
- Create separate, modular files for all hooks and components to ensure a clean, maintainable project structure.
- Build the interface with a fully responsive design, optimized for mobile, tablet, and desktop devices.
- Configure all action buttons to appear only when the user hovers over the relevant element, where appropriate for the interaction.
- Ensure every interactive button uses the `cursor: pointer` style to clearly indicate that it is clickable.
-ensure you use our enterprise level drodpwon selections for all designs