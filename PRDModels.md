PRD Template Library
A reference set of PRD formats by company style, org maturity, and product type. Use the decision guide below to pick the right one, then jump to that template.


Decision Guide: Which Template Do I Use?
If you're...
Use
An early-stage startup, small team, moving fast
Lightweight One-Pager
Writing for exec/leadership buy-in before building
Amazon Working Backwards (PR-FAQ)
At a company that separates "what/why" from "how"
Google-Style Design Doc split
Iterating in the open, want engineering input on the approach itself
Shopify-Style RFC
Embedding directly with engineers, API/data-heavy feature
Technical PM Template
Growth, experimentation, or behavioral feature
Generalist/Growth PM Template
Building enterprise or B2B software (like Sellytics/Miniventory)
B2B Template
Building consumer-facing product
B2C Template
Small team where PM and eng docs are combined
Merged PRD + Tech Spec



1. Lightweight Startup One-Pager
Best for: pre-seed to Series A, single-team execution, speed over process.

FEATURE: [Name]

DATE: [date]

OWNER: [name]

PROBLEM

What's broken or missing, in 2-3 sentences.

SOLUTION

What we're building, in 2-3 sentences.

SUCCESS METRIC

The one number that tells us this worked.

SCOPE

- In: 

- Out:

DONE WHEN

The specific, observable condition that means this ships.

That's it. No sign-off chains, no phased sections. The whole doc should fit on one screen.


2. Amazon-Style Working Backwards (PR-FAQ)
Best for: getting leadership alignment before a single line of spec is written. Forces clarity on customer value before implementation details exist.

[PRESS RELEASE — written as if the feature already shipped]

HEADLINE: [One sentence, customer-benefit framing]

SUBHEADING: [Who it's for, one sentence]

SUMMARY PARAGRAPH: 

What the feature is and why it matters, written for a customer, not a stakeholder.

PROBLEM PARAGRAPH:

What customers struggle with today, in their words.

SOLUTION PARAGRAPH:

How this feature solves it, described in plain language — no internal jargon.

QUOTE FROM A LEADER:

A hypothetical quote from someone at the company explaining why this matters.

HOW TO GET STARTED:

What the customer does to use it.

QUOTE FROM A CUSTOMER:

A hypothetical customer describing the before/after.

CLOSING + CALL TO ACTION

---

[FAQ — internal and external questions, answered honestly]

INTERNAL FAQ

- Why now?

- What's the cost/effort to build this?

- What are we explicitly NOT doing?

- What could make this fail?

- What's the impact on [adjacent team/system]?

- What metric proves this worked in 90 days?

EXTERNAL / CUSTOMER FAQ

- What does this cost?

- How is this different from [alternative]?

- What happens to my existing [data/workflow] when I use this?

The discipline here: if you can't write a compelling press release, the feature probably isn't compelling. If the FAQ reveals unanswered risk, you're not ready to build.


3. Google-Style Design Doc Split
Google-style orgs typically separate the PRD (why/what) from the Design Doc (how), written by PM and eng lead respectively, but linked.

PRD half:

OBJECTIVE

One sentence, outcome-oriented.

BACKGROUND

Context a new reader needs — prior attempts, related systems, why this is being tackled now.

USER PROBLEM

Grounded in research/data, not assumption.

GOALS

- Goal (with metric)

Non-goals (explicit)

REQUIREMENTS

Numbered, testable statements — not solutions.

MILESTONES

Key dates, not full project plan.

Design Doc half (owned by eng, PM contributes context):

OVERVIEW — plain-language summary of the approach

SYSTEM CONTEXT — where this sits in the broader architecture

DETAILED DESIGN — data model, API contracts, sequence diagrams

ALTERNATIVES CONSIDERED — and why rejected

CROSS-CUTTING CONCERNS — security, privacy, scalability, monitoring

ROLLOUT / MIGRATION PLAN

The split matters because it lets the PRD stay stable while the design doc iterates as implementation reality sets in.


4. Shopify-Style RFC
Best for: teams that want engineering, design, and data weighing in on the problem framing, not just reviewing a finished spec.

RFC: [Feature/Change Name]

STATUS: Draft → Under Discussion → Accepted → Implemented

AUTHOR: 

REVIEWERS: 

## Summary

2-3 sentences — what and why, no fluff.

## Motivation

What happens if we do nothing? What's the cost of inaction?

## Proposal

The approach, in enough detail for informed critique — not full spec.

## Alternatives Considered

At least 2, with tradeoffs. This section is often the most valuable part of an RFC.

## Open Questions

Explicitly unresolved — invites comment.

## Impact

Who/what this touches: other teams, systems, customer-facing surfaces.

---

[Comments/discussion thread lives below or in a linked doc]

RFCs are meant to be argued with before they're built — the doc is a discussion artifact first, spec second.


5. Technical PM Template
Best for: PMs embedded closely with engineering, API-first products, platform features.

FEATURE: [Name]

OWNER: 

ENGINEERING LEAD:

## Problem & Goal

Standard problem statement + measurable goal.

## User Stories

As a [user], I want [action], so that [benefit].

## API / Data Contract

Endpoints, request/response shapes, or schema changes.

| Field | Type | Required | Notes |

|---|---|---|---|

## System Behavior

State transitions, business logic rules, validation rules.

## Edge Cases & Failure Modes

| Scenario | Expected Behavior |

|---|---|

## Performance & Scale Requirements

Expected load, latency budgets, rate limits.

## Security / Permissions

Who can do what. Auth requirements.

## Dependencies

Upstream/downstream systems, other teams' APIs.

## Rollout & Monitoring

Feature flag plan, logging/metrics to add, alerting thresholds.

This is close to what your Miniventory sprint PRDs likely need — schema and POS engine work in particular benefit from the explicit data contract section.


6. Generalist / Growth PM Template
Best for: experimentation-driven features, funnel optimization, behavioral changes.

FEATURE/EXPERIMENT: [Name]

HYPOTHESIS: If we [change], then [user behavior] will [improve], because [reasoning].

## Current State

Baseline metric, funnel stage, or behavior pattern being targeted.

## Target Users

Segment definition — who sees this.

## Experiment Design

- Control vs. variant(s)

- Sample size / duration needed for significance

- Primary metric + guardrail metrics

## User Flow

Before/after flow diagrams.

## Success Criteria

Statistically significant lift on [metric], no regression on [guardrail].

## Risks

What could this break or cannibalize elsewhere?

## Rollout

% ramp plan, kill criteria.


7. B2B Template
Best for: enterprise software, admin-heavy products — relevant to Sellytics/Miniventory given multi-user, permissions, and financial data involved.

FEATURE: [Name]

OWNER:

## Problem Statement

Include which customer segment/tier this affects (SMB vs. enterprise).

## Goals & Success Metrics

Business metrics (retention, expansion revenue, support ticket reduction) alongside product metrics.

## Personas

Distinguish between end-user, admin, and buyer/decision-maker personas — they often want different things.

## Requirements

### Core functionality

Standard functional requirements table.

### Admin & Permissions

- Roles affected

- What each role can view/edit/approve

- Audit trail requirements

### Configuration

What's configurable per-account/org vs. fixed globally.

## Integration & Data Requirements

Existing systems this must sync with (accounting, ERP, other B2B tools).

## Compliance & Security

Data residency, audit logging, SOC2/regulatory considerations — critical if touching financial or inventory data.

## Edge Cases

Multi-user conflict scenarios, partial permission states, org-level vs. user-level failures.

## Rollout Plan

Beta customer selection, account-level feature flagging, customer success/support enablement plan.


8. B2C Template
Best for: consumer-facing apps, high-volume/low-touch usage.

FEATURE: [Name]

OWNER:

## Problem Statement

Grounded in user research, reviews, or behavioral data.

## Goals & Success Metrics

Engagement, retention, conversion — usually a single north-star metric plus 1-2 supporting ones.

## User Persona

Usually one primary persona, described with real behavioral detail (not demographics).

## User Flow / UX

Heavy emphasis here — wireframes, interaction states, motion/microcopy notes.

## A/B Test Plan

Almost always shipped as an experiment first.

## Edge Cases

Empty states, first-time-use states, low-connectivity/offline behavior.

## Accessibility

WCAG considerations, screen reader behavior.

## Rollout Plan

Phased % rollout, app store considerations if mobile, kill switch plan.


9. Merged PRD + Tech Spec (Small Team Format)
Best for: small teams where PM and eng share one doc rather than splitting it.

FEATURE: [Name]

OWNER (Product): 

OWNER (Eng):

STATUS:

## 1. Problem & Goal

Problem statement + measurable goal.

## 2. User Stories

As a [user], I want [action], so that [benefit].

## 3. Requirements

Functional requirements table (Must/Should/Could).

## 4. Technical Approach

How it will be built — architecture summary, data model changes, API changes. Written collaboratively.

## 5. Edge Cases & Error States

Combined product + engineering edge case list.

## 6. Out of Scope

Explicit non-goals — prevents scope creep from either side.

## 7. Testing Plan

QA approach, key test cases.

## 8. Rollout Plan

Flag strategy, monitoring, rollback plan.

## 9. Open Questions




