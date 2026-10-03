# Market Research Template Library (SaaS)

Companion to the Strategy, Roadmap, and PRD libraries — this is the layer that should come *before* strategy, not after. A strategy doc built without real market research is just an opinion with formatting. Each template below answers a different research question — pick based on what you actually don't know yet, not habit.

---

## Decision Guide: Which Template Do I Use?

| If you don't know... | Use |
|---|---|
| Who your competitors really are and how you stack up | Competitive Analysis Matrix |
| Whether a market is worth entering, and how big it is | TAM / SAM / SOM Sizing |
| Who actually buys/uses this and what they need | Ideal Customer Profile (ICP) & Persona |
| What's happening in customers' own words | Customer Interview / Discovery Guide |
| Why customers churn or don't convert | Win/Loss Analysis |
| Whether an idea has legs before building it | Problem Validation / Opportunity Assessment |
| Where a feature/product sits vs. alternatives on what matters to buyers | Positioning & Perceptual Map |
| What's shifting in the broader market that could affect strategy | Industry/Market Trends Scan |
| How to price something you don't yet have pricing data for | Pricing Research Template |
| What's actually driving usage/adoption in your own product | Product Usage & Voice of Customer Synthesis |

---

## 1. Competitive Analysis Matrix

Best for: understanding the competitive landscape before positioning or roadmap decisions.

```
MARKET: [e.g., PM tools for hybrid Agile/Waterfall teams]
DATE:

DIRECT COMPETITORS
| Competitor | Target Segment | Pricing Model | Key Strength | Key Weakness | Our Edge |
|---|---|---|---|---|---|

INDIRECT COMPETITORS / SUBSTITUTES
[Includes "do nothing," spreadsheets, in-house tools — often the real competitor for early-stage SaaS]
| Alternative | Why customers use it instead | Why they'd switch |
|---|---|---|

FEATURE COMPARISON
| Feature | Us | Competitor A | Competitor B | Competitor C |
|---|---|---|---|---|

PRICING COMPARISON
| Competitor | Entry Price | Mid Tier | Enterprise | Notable Pricing Mechanic |
|---|---|---|---|---|

GO-TO-MARKET COMPARISON
How each competitor acquires customers (PLG/self-serve, sales-led, partnerships, content) — matters as much as feature parity.

KEY TAKEAWAYS
The 3-4 things this analysis actually changes about your strategy — a competitive matrix that doesn't change a decision wasn't worth building.
```

---

## 2. TAM / SAM / SOM Sizing

Best for: assessing market opportunity size — critical for fundraising decks and prioritization, easy to fake, so show your math.

```
MARKET: [Name]

TAM (Total Addressable Market)
The total market demand if you captured 100% of it globally.
Method: [Top-down (industry reports) / Bottom-up (unit economics × potential customers) / Value theory (value delivered × capture rate)]
Calculation shown: [Don't just state a number — show the math]
Source(s): [Cite]

SAM (Serviceable Addressable Market)
The portion of TAM reachable given your actual product, geography, and business model constraints.
Narrowing logic: [e.g., "TAM includes all PM software; SAM excludes enterprise-only tools since we're SMB-focused"]
Calculation:

SOM (Serviceable Obtainable Market)
The realistic portion you can capture in [timeframe], given competition, GTM capacity, and market maturity.
Calculation:
Assumptions: [Sales capacity, conversion rates, market share assumptions — state them explicitly]

SANITY CHECK
Compare SOM to: (a) a comparable competitor's actual revenue at similar stage, (b) your current pipeline/traction if any. If SOM is wildly out of line with both, revisit assumptions.
```

The single most common mistake here: presenting TAM as if it's the opportunity, when SOM is what actually matters for near-term strategy. Always show all three, never just TAM.

---

## 3. Ideal Customer Profile (ICP) & Persona

Best for: sharpening who you're actually building for — especially important for B2B SaaS where "buyer" and "user" are often different people.

```
ICP DEFINITION (Firmographic — the company, not the person)
- Company size: [employee range / revenue range]
- Industry/vertical:
- Geography:
- Tech stack / existing tools:
- Growth stage:
- Trigger event: [What situation makes them start looking for a solution now?]

BUYER PERSONA: [e.g., "Head of Product Operations"]
- Role & seniority:
- Reports to:
- Success metrics they're measured on:
- Budget authority: [Yes/No/Influencer]
- Primary objection when evaluating tools:

USER PERSONA: [e.g., "Project Manager, day-to-day user" — often different from buyer]
- Role:
- Jobs to be done: [What are they actually trying to accomplish?]
- Current workaround: [Spreadsheet, another tool, manual process]
- Pain points, ranked by severity:
  1.
  2.
  3.

ANTI-PERSONA
Who this is explicitly NOT for — prevents chasing bad-fit customers who churn or demand the wrong features.

VALIDATION SOURCE
[How was this built — interviews (n=X), survey data, sales call notes, support ticket analysis? Personas built from imagination rather than evidence should say so honestly.]
```

---

## 4. Customer Interview / Discovery Guide

Best for: structuring qualitative research so it produces usable signal instead of just conversation.

```
RESEARCH GOAL
The specific question this round of interviews needs to answer — not "learn about users" but e.g. "understand why budget approval workflows break down today."

PARTICIPANT CRITERIA
Who qualifies for this interview round, and why.

SCREENER QUESTIONS
[1-3 questions to confirm the participant is a real fit before scheduling]

INTERVIEW GUIDE
Opening (build rapport, get context)
- "Walk me through how you currently handle [process]."

Problem exploration (avoid leading questions)
- "Tell me about the last time [problem] happened."
- "What did you do about it?"
- "What was frustrating about that?"

Avoid: "Would you use a feature that does X?" — hypothetical future behavior is unreliable; anchor on past, specific behavior instead.

Closing
- "Is there anything I should have asked but didn't?"

SYNTHESIS TEMPLATE (fill after each interview)
| Participant | Key Quote | Underlying Need | Surprise/Contradiction |
|---|---|---|---|

CROSS-INTERVIEW PATTERNS
After 5+ interviews, look for: recurring language customers use unprompted, problems mentioned without being asked, workarounds that reveal unmet needs.
```

---

## 5. Win/Loss Analysis

Best for: understanding why deals are won or lost — chronically underused in SaaS despite being one of the highest-signal research types available.

```
DEAL: [Company name / segment]
OUTCOME: Won / Lost / Churned
DATE:

DECISION CRITERIA
What the buyer said mattered most in their decision (in their words, not yours).

COMPETITIVE CONTEXT
What else did they evaluate? Why those alternatives specifically?

WHY WE WON / WHY WE LOST
Primary reason (get specific — "price" is rarely the full story; ask what price relative to what perceived value).

WHAT WOULD HAVE CHANGED THE OUTCOME
If lost: what would have made them choose us? If won: what almost made them choose someone else?

SALES CYCLE NOTES
Length, number of stakeholders involved, where friction occurred.

PATTERN TRACKING (aggregate across multiple win/loss records)
| Reason Category | # Wins | # Losses | Trend |
|---|---|---|---|

ACTION ITEMS
What this specific deal should change about product, pricing, or positioning — win/loss data that doesn't change anything wasn't synthesized properly.
```

---

## 6. Problem Validation / Opportunity Assessment

Best for: testing whether an idea is worth building *before* it becomes a strategy bet or PRD — the gate that should sit before GIST's "step-project" stage.

```
HYPOTHESIS
"We believe [customer segment] struggles with [problem], and that solving it would [value], because [reasoning]."

EVIDENCE FOR
- [Data point / quote / observed behavior]
- [Data point]

EVIDENCE AGAINST / UNKNOWN
- [Counter-signal or genuine unknown — be honest here]

MARKET SIGNAL
- Search volume / competitor activity in this space
- Existing workarounds customers have built themselves (strong signal — people don't build workarounds for problems they don't have)

SEVERITY & FREQUENCY
How often does this problem occur, and how painful is it when it does? (A frequent-but-minor annoyance and a rare-but-severe crisis require very different solutions.)

WILLINGNESS TO PAY SIGNAL
Any evidence customers would pay to solve this — not hypothetical ("would you pay for X") but revealed (what they currently spend time/money on to work around it).

VALIDATION VERDICT
Proceed / Needs more research / Kill — with reasoning. A validation doc that always concludes "proceed" isn't doing its job.
```

---

## 7. Positioning & Perceptual Map

Best for: understanding where you sit relative to competitors on the dimensions buyers actually care about.

```
MARKET: [Name]

DIMENSIONS THAT MATTER TO BUYERS
Choose 2 axes buyers actually use to evaluate options (not dimensions you wish mattered) — e.g., "Ease of use" vs. "Depth of functionality," or "Price" vs. "Enterprise readiness."

PERCEPTUAL MAP
[Plot competitors + yourself on the 2x2 — can be built as a simple diagram]
       High [Dimension Y]
              |
   Comp A     |     Us
              |
--------------+-------------- 
              |
   Comp B     |    Comp C
              |
       Low [Dimension Y]
   Low [Dimension X] ─────► High [Dimension X]

WHITE SPACE IDENTIFIED
Where is there buyer demand but no strong competitor occupying that position?

POSITIONING STATEMENT
"For [target segment] who [need], [product] is the [category] that [key differentiator], unlike [primary alternative] which [limitation]."

VALIDATION
Does this positioning match how customers actually describe you in win/loss interviews and reviews? If not, there's a gap between intended and perceived positioning worth closing.
```

---

## 8. Industry / Market Trends Scan

Best for: periodic (quarterly/annual) environmental scanning to catch shifts that should influence strategy.

```
MARKET: [Name]
PERIOD COVERED:

MACRO TRENDS
[Economic, regulatory, technological shifts affecting the category — e.g., AI adoption in PM tools, remote work normalization]

CUSTOMER BEHAVIOR SHIFTS
How is buyer behavior changing — budget scrutiny, buying committee size, self-serve vs. sales-assisted preference?

COMPETITIVE MOVEMENT
Notable competitor moves — funding rounds, pivots, new entrants, M&A, pricing changes.

TECHNOLOGY SHIFTS
New capabilities (e.g., AI features) becoming table-stakes vs. still-differentiating.

EMERGING SEGMENTS OR USE CASES
Any new buyer segment or use case gaining traction that wasn't part of the original ICP.

IMPLICATIONS FOR STRATEGY
The 2-3 things this scan should actually change — feed directly into your next Strategy doc revision (Playing to Win / Portfolio Strategy).
```

---

## 9. Pricing Research Template

Best for: gathering evidence before setting or changing pricing — SaaS pricing is one of the most under-researched, most consequential decisions teams make.

```
PRODUCT/TIER BEING PRICED:

VALUE METRIC IDENTIFICATION
What does the customer perceive as "more value" as they use more of the product — seats, usage volume, features unlocked? This should drive the pricing axis.

COMPETITOR PRICING BENCHMARK
| Competitor | Model (seat/usage/flat) | Entry Price | What's Gated at Each Tier |
|---|---|---|---|

VAN WESTENDORP-STYLE QUESTIONS (if running a pricing survey)
- At what price would this be so cheap you'd question the quality?
- At what price would this be a bargain?
- At what price would this start to feel expensive but you'd still consider it?
- At what price would this be too expensive to consider?

WILLINGNESS TO PAY SIGNAL FROM EXISTING CUSTOMERS
Actual behavior: upgrade/downgrade patterns, feature requests tied to "would pay more for X."

PACKAGING HYPOTHESIS
Proposed tiers, what's gated at each, and the reasoning for the gate (should map to the value metric, not arbitrary feature bundling).

RISK OF CURRENT/PROPOSED PRICING
Where might this leave money on the table, or price out a segment you need?
```

---

## 10. Product Usage & Voice of Customer Synthesis

Best for: mining your *own* product data and support/feedback channels — often the highest-signal, lowest-cost research SaaS teams underuse.

```
PERIOD COVERED:

USAGE PATTERNS
- Most/least used features (and any surprising gaps between intended and actual usage)
- Common paths to activation vs. common drop-off points
- Power user behavior vs. at-risk/low-engagement behavior

SUPPORT TICKET THEMES
| Theme | Volume | Trend | Linked to Churn Risk? |
|---|---|---|---|

FEATURE REQUEST PATTERNS
Requests clustered by underlying need (not just tallied by literal ask — ten different literal requests often point to one real need).

NPS / CSAT VERBATIM THEMES
Recurring language in open-text survey responses — both praise and criticism.

SALES/CS CALL THEMES
What prospects and customers say unprompted in calls — often surfaces objections and needs product research misses.

SYNTHESIZED INSIGHT
The 3-5 things this synthesis reveals that should feed into the next roadmap or strategy cycle.
```

---

## Notes on Using These for The Sprint School

This library completes the chain that started with Strategy and Roadmap: **Market Research → Strategy → Roadmap → PRD.** Most PM curricula (and most junior PMs) start at PRD and work backward only when something goes wrong — the discipline worth teaching explicitly is that a PRD should be traceable all the way back to a piece of *evidence*, not just a strategic pillar.

A good worked exercise for the cohort: pick one Sellytics or Miniventory feature already in the PRD library, and have them reconstruct the research that *should* have preceded it — which template would have surfaced the need, and what evidence (real or plausibly simulated, given Sellytics is a fictional case study) would justify the bet. That reverse-engineering exercise tends to reveal gaps in a way forward-building never does.
# Market Research

**Product / Initiative:** [Product Name]
**Company:** [Company Name]
**Research Owner:** Product Manager
**Research Team:** [Names / Functions]
**Status:** Draft / In Progress / Completed
**Version:** 1.0
**Research Period:** [Start Date – End Date]
**Date:** [Date]

---

# 1. Executive Summary

### Research Overview

[Summarize what was researched, why it was researched, and the most important findings.]

### Key Findings

1. [Finding]
2. [Finding]
3. [Finding]
4. [Finding]
5. [Finding]

### Strategic Implication

[Explain what the findings mean for the product/business.]

### Recommendation

[Based on the research, what should the company do?]

* Proceed
* Proceed with changes
* Conduct additional research
* Delay
* Do not proceed

---

# 2. Research Purpose

### Business Decision

**What decision will this research support?**

> [Example: Should we enter the SME inventory-management market in Nigeria, and if so, which customer segment should we target first?]

### Research Objective

[What specifically are we trying to learn?]

### Research Questions

1. [Question]
2. [Question]
3. [Question]
4. [Question]
5. [Question]

### Research Priorities

**Must Answer**

* [Critical question]
* [Critical question]

**Should Answer**

* [Question]
* [Question]

**Nice to Know**

* [Question]
* [Question]

---

# 3. Market Definition

### Market

[Define the market being investigated.]

### Industry

[Industry]

### Geography

[Country / Region / City]

### Customer Segment

[SMB / Enterprise / Consumer / Government etc.]

### Product Category

[Category]

### Market Boundaries

**Included:**

* [Area]
* [Area]

**Excluded:**

* [Area]
* [Area]

---

# 4. Market Size

## TAM — Total Addressable Market

[Estimate the total potential market.]

**TAM:** [Value]

**Calculation:**

> [Number of potential customers × annual revenue/customer]

---

## SAM — Serviceable Available Market

[Market that the product can realistically serve based on geography, segment, product capabilities, etc.]

**SAM:** [Value]

---

## SOM — Serviceable Obtainable Market

[Realistic portion of the market that can be captured.]

**SOM:** [Value]

---

# 5. Market Growth

### Current Market Size

[Value]

### Historical Growth

[Growth rate]

### Projected Growth

[Growth rate]

### Growth Drivers

* [Driver]
* [Driver]
* [Driver]

### Market Constraints

* [Constraint]
* [Constraint]
* [Constraint]

### Market Trends

| Trend   | Evidence   | Impact on Product |
| ------- | ---------- | ----------------- |
| [Trend] | [Evidence] | High/Medium/Low   |
| [Trend] | [Evidence] | High/Medium/Low   |
| [Trend] | [Evidence] | High/Medium/Low   |

---

# 6. Target Customer Research

### Primary Segment

[Description]

### Secondary Segment

[Description]

### Customer Characteristics

| Attribute           | Primary Segment |
| ------------------- | --------------- |
| Industry            | [Industry]      |
| Company Size        | [Size]          |
| Geography           | [Location]      |
| Employees           | [Range]         |
| Revenue             | [Range]         |
| Technology Adoption | [Level]         |

---

# 7. Customer Problems

| Problem   | Frequency | Severity | Current Solution | Opportunity |
| --------- | --------- | -------- | ---------------- | ----------- |
| [Problem] | High      | High     | [Solution]       | High        |
| [Problem] | Medium    | High     | [Solution]       | High        |
| [Problem] | High      | Medium   | [Solution]       | Medium      |

### Top Customer Pain Points

1. [Pain point]
2. [Pain point]
3. [Pain point]
4. [Pain point]
5. [Pain point]

---

# 8. Customer Jobs-to-be-Done

| Customer Job | Current Approach | Pain   | Desired Outcome |
| ------------ | ---------------- | ------ | --------------- |
| [Job]        | [Approach]       | [Pain] | [Outcome]       |
| [Job]        | [Approach]       | [Pain] | [Outcome]       |

### Primary Job

> When [situation], I want to [motivation], so I can [desired outcome].

---

# 9. Customer Research

## Research Method

Select applicable methods:

* Customer interviews
* Surveys
* Focus groups
* Usability research
* Observational research
* Customer support analysis
* Product analytics
* Sales interviews
* Secondary research
* Industry reports

## Participants

**Target Participants:** [Description]

**Number of Participants:** [Number]

**Recruitment Method:** [Method]

### Participant Profile

| Participant | Role   | Segment   | Location   | Experience   |
| ----------- | ------ | --------- | ---------- | ------------ |
| P01         | [Role] | [Segment] | [Location] | [Experience] |
| P02         | [Role] | [Segment] | [Location] | [Experience] |

---

# 10. Customer Research Findings

### Finding 01 — [Finding]

**Evidence:**

[What customers said/did.]

**Frequency:** [High / Medium / Low]

**Impact:** [High / Medium / Low]

**Implication:**

[What this means for the product.]

---

### Finding 02 — [Finding]

**Evidence:**

[Evidence]

**Frequency:** [High / Medium / Low]

**Impact:** [High / Medium / Low]

**Implication:**

[Implication]

---

# 11. Competitor Research

### Competitive Landscape

| Competitor   | Target Customer | Core Offering | Strengths  | Weaknesses | Pricing |
| ------------ | --------------- | ------------- | ---------- | ---------- | ------- |
| [Competitor] | [Customer]      | [Offering]    | [Strength] | [Weakness] | [Price] |
| [Competitor] | [Customer]      | [Offering]    | [Strength] | [Weakness] | [Price] |

### Direct Competitors

* [Competitor]
* [Competitor]
* [Competitor]

### Indirect Competitors

* [Alternative]
* [Alternative]
* [Alternative]

### Current Alternatives

[How customers solve the problem without your product.]

---

# 12. Competitive Gap Analysis

| Customer Need | Existing Solutions | Gap   | Opportunity   |
| ------------- | ------------------ | ----- | ------------- |
| [Need]        | [Solutions]        | [Gap] | [Opportunity] |
| [Need]        | [Solutions]        | [Gap] | [Opportunity] |
| [Need]        | [Solutions]        | [Gap] | [Opportunity] |

### Competitive Opportunity

[Where can the product differentiate?]

---

# 13. Pricing Research

### Current Market Pricing

| Competitor   | Pricing Model | Entry Price | Premium Price |
| ------------ | ------------- | ----------: | ------------: |
| [Competitor] | Subscription  |     [Price] |       [Price] |
| [Competitor] | Usage         |     [Price] |       [Price] |

### Customer Willingness to Pay

**Expected Range:** [Range]

**Evidence:**

[Research evidence]

### Pricing Model Opportunities

* Subscription
* Usage-based
* Transaction-based
* Freemium
* Tiered
* Enterprise
* Marketplace commission

---

# 14. Market Drivers & Barriers

## Drivers

* [Driver]
* [Driver]
* [Driver]

## Barriers

* [Barrier]
* [Barrier]
* [Barrier]

## Enablers

* [Enabler]
* [Enabler]

---

# 15. Regulatory & Environmental Factors

### Regulations

* [Regulation]
* [Regulation]

### Compliance Requirements

* [Requirement]
* [Requirement]

### Technology Changes

* [Technology trend]
* [Technology trend]

### Economic Factors

* [Factor]
* [Factor]

---

# 16. SWOT Analysis

| Strengths  | Weaknesses |
| ---------- | ---------- |
| [Strength] | [Weakness] |
| [Strength] | [Weakness] |

| Opportunities | Threats  |
| ------------- | -------- |
| [Opportunity] | [Threat] |
| [Opportunity] | [Threat] |

---

# 17. Market Opportunities

### Opportunity 01 — [Opportunity]

**Customer Problem:**
[Problem]

**Market Evidence:**
[Evidence]

**Potential Value:**
[Value]

**Strategic Fit:**
High / Medium / Low

---

### Opportunity 02 — [Opportunity]

**Customer Problem:**
[Problem]

**Market Evidence:**
[Evidence]

**Potential Value:**
[Value]

**Strategic Fit:**
High / Medium / Low

---

# 18. Hypotheses & Assumptions

| Hypothesis   | Evidence   | Confidence | Validation Method | Result      |
| ------------ | ---------- | ---------- | ----------------- | ----------- |
| [Hypothesis] | [Evidence] | Low        | [Method]          | Pending     |
| [Hypothesis] | [Evidence] | Medium     | [Method]          | Validated   |
| [Hypothesis] | [Evidence] | High       | [Method]          | Invalidated |

---

# 19. Key Insights

### Insight 01

[Insight]

### Insight 02

[Insight]

### Insight 03

[Insight]

### Insight 04

[Insight]

### Insight 05

[Insight]

---

# 20. Research Conclusions

Based on the evidence collected:

### Market Attractiveness

**Rating:** High / Medium / Low

**Reason:**

[Explanation]

### Customer Need

**Rating:** High / Medium / Low

**Reason:**

[Explanation]

### Competitive Opportunity

**Rating:** High / Medium / Low

**Reason:**

[Explanation]

### Business Potential

**Rating:** High / Medium / Low

**Reason:**

[Explanation]

---

# 21. Recommendations

Based on the research, we recommend:

### Recommendation 01

[Recommendation]

### Recommendation 02

[Recommendation]

### Recommendation 03

[Recommendation]

### Recommended Product Direction

[Summarize what the research suggests the product should do.]

---

# 22. Strategic Implications

The research should inform:

* Product Strategy
* Product Vision
* Target Personas
* Value Proposition
* Product Positioning
* Product Roadmap
* Feature Prioritization
* Pricing Strategy
* Go-To-Market Strategy
* Business Model

---

# 23. Research-to-Strategy Mapping

| Research Finding | Product Implication | Strategic Response |
| ---------------- | ------------------- | ------------------ |
| [Finding]        | [Implication]       | [Response]         |
| [Finding]        | [Implication]       | [Response]         |
| [Finding]        | [Implication]       | [Response]         |

---

# 24. Research Limitations

[Document limitations that could affect confidence in the findings.]

Examples:

* Small sample size
* Limited geographic coverage
* Limited competitor data
* Self-reported customer behavior
* Limited historical data
* Emerging market conditions

---

# 25. Sources

| Source   | Type               | Date   | Key Information | Link   |
| -------- | ------------------ | ------ | --------------- | ------ |
| [Source] | Industry Report    | [Date] | [Finding]       | [Link] |
| [Source] | Customer Interview | [Date] | [Finding]       | N/A    |
| [Source] | Competitor         | [Date] | [Finding]       | [Link] |

---

# 26. Research Decision

### Final Recommendation

**Decision:**

* [ ] Proceed
* [ ] Proceed with changes
* [ ] Conduct additional research
* [ ] Defer
* [ ] Do not proceed

### Decision Rationale

[Explain the evidence behind the decision.]

---

# 27. Next Steps

| Action   | Owner   | Priority | Due Date |
| -------- | ------- | -------- | -------- |
| [Action] | [Owner] | P0       | [Date]   |
| [Action] | [Owner] | P1       | [Date]   |
| [Action] | [Owner] | P2       | [Date]   |

---

# 28. Related Documents

* Product Strategy
* Competitive Analysis
* Customer Personas
* Customer Journey Map
* Product Discovery
* Business Case
* Product Roadmap
* Product Requirements Document
* Go-To-Market Strategy

---

# 29. Approval

| Role              | Name   | Status  | Date   |
| ----------------- | ------ | ------- | ------ |
| Product Manager   | [Name] | Pending | [Date] |
| Business Owner    | [Name] | Pending | [Date] |
| Research Lead     | [Name] | Pending | [Date] |
| Executive Sponsor | [Name] | Pending | [Date] |
