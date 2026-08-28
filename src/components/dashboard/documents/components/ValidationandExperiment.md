🧪 Validation & Experimentation
VALIDATION & EXPERIMENTATION
│
├── 1. Validation Objectives
├── 2. Assumptions
├── 3. Riskiest Assumptions
├── 4. Validation Hypotheses
├── 5. Success Criteria
├── 6. Experiment Design
├── 7. Experiment Type
├── 8. Experiment Setup
├── 9. Prototype Testing
├── 10. Usability Testing
├── 11. Customer Validation
├── 12. Demand Validation
├── 13. Value Validation
├── 14. Willingness-to-Pay Validation
├── 15. Technical Validation
├── 16. Business Validation
├── 17. A/B Testing
├── 18. Experiment Execution
├── 19. Data Collection
├── 20. Results Analysis
├── 21. Qualitative Evidence
├── 22. Quantitative Evidence
├── 23. Hypothesis Evaluation
├── 24. Learnings & Insights
├── 25. Decision
├── 26. Iteration
├── 27. Experiment Log
└── 28. Validation Report
1. Validation Objectives
Define what you need to prove or disprove.
Example:
Determine whether multi-store retailers would use a unified inventory dashboard to monitor stock across locations.

2. Assumptions
List everything your solution currently assumes to be true.
Examples:
Customers have this problem.
The problem happens frequently.
Customers consider it important.
Existing solutions are inadequate.
Customers understand the proposed solution.
Customers will use it.
Customers will pay for it.
We can technically build it.

3. Riskiest Assumptions
Not every assumption deserves equal testing.
Prioritize assumptions based on:
Importance × Uncertainty
Example:
Assumption
Importance
Uncertainty
Priority
Customers experience the problem
5
2
Medium
Customers want the proposed solution
5
5
Critical
Customers will pay
5
5
Critical
API can support it
4
2
Medium


4. Validation Hypotheses
Turn assumptions into testable statements.
We believe multi-store retailers will use a centralized inventory dashboard because they currently struggle to monitor stock across locations.
A good hypothesis should be:
Specific
Measurable
Falsifiable
Testable

5. Success Criteria
Define what constitutes a successful experiment before running it.
Example:
At least 70% of target users successfully complete the inventory-monitoring task without assistance.
This prevents moving the goalposts after seeing the results.

6. Experiment Design
Define:
Hypothesis
     ↓
Experiment
     ↓
Participants
     ↓
Method
     ↓
Metric
     ↓
Success Threshold
     ↓
Decision

7. Experiment Type
Choose the cheapest experiment capable of answering the question.
Discovery experiments
Customer interview
Observation
Survey
Concept test
Solution experiments
Prototype test
Usability test
Design validation
Demand experiments
Landing page
Fake door
Waitlist
Pre-order
CTA test
Product experiments
A/B test
Feature flag
Beta release
Technical experiments
Proof of concept
Spike
Performance test

8. Experiment Setup
Document exactly how the experiment will run.
Include:
Objective
Hypothesis
Audience
Sample size
Duration
Procedure
Variables
Metrics
Success criteria
Tools
Owner

9. Prototype Testing
Test the solution before building it.
Evaluate:
Comprehension
Navigation
Task completion
Value perception
Confusion
Friction
Expected behavior

10. Usability Testing
Give users realistic tasks.
Example:
"Find which store has the lowest stock of Product X and determine what you would do next."
Measure:
Completion rate
Time
Errors
Assistance
Confidence

11. Customer Validation
Validate whether the solution actually addresses the customer's problem.
Ask:
Does this solve your problem?
Does it fit your workflow?
What would you replace?
What would prevent you from using it?
How important is this compared with other problems?
But prioritize behavior and evidence over enthusiastic opinions.

12. Demand Validation
Determine whether there is actual demand.
Evidence can include:
Sign-ups
Waitlist registrations
Demo requests
Click-throughs
Trial activation
Feature adoption
Repeat usage

13. Value Validation
Test:
Does the customer perceive enough value to change behavior?
For example:
Before:
"I spend 2 hours every week reconciling stock."
After:
"The workflow reduces this to 20 minutes."
Now you're testing outcome value, not just feature interest.

14. Willingness-to-Pay Validation
Where appropriate, test whether customers attach economic value to the solution.
Methods include:
Pricing interviews
Concept + price testing
Landing-page pricing tests
Existing purchasing behavior
Paid pilot
Trial-to-paid conversion
The strongest evidence is generally actual behavior, not simply saying "I'd pay."

15. Technical Validation
Engineering validates critical technical assumptions.
Examples:
Can the API handle required volume?
Can the architecture support the workflow?
Can offline synchronization work?
Can required data be obtained?
Can response times meet requirements?
Output
Technical proof / feasibility evidence

16. Business Validation
Test whether the solution makes business sense.
Evaluate:
Revenue potential
Cost to serve
Acquisition economics
Retention potential
Operational complexity
Pricing
Strategic value

17. A/B Testing
When you already have sufficient product traffic, compare alternatives.
Example:
VERSION A
Current inventory dashboard
       │
       ├── Conversion: 18%
       │
       ▼
VERSION B
New inventory dashboard
       │
       ├── Conversion: 24%
       ▼
Evaluate significance + business impact
Don't use A/B testing when you don't have enough traffic or when a prototype/interview would answer the question more cheaply.

18. Experiment Execution
Run the experiment according to the predefined protocol.
Track:
Participants
Dates
Conditions
Observations
Metrics
Unexpected events
Deviations from the plan

19. Data Collection
Collect both:
Quantitative
Conversion
Completion
Adoption
Retention
Time
Error rate
Revenue
Qualitative
Quotes
Observations
Confusion
Motivations
Objections
Workarounds

20. Results Analysis
Compare the actual result against the predefined success criteria.
Example:
Target: 70% task completion
Result: 82%
Conclusion: Threshold achieved.

21. Qualitative Evidence
Capture why something happened.
Example:
Users successfully found low-stock products but didn't understand what the "Stock Health" score meant.
That tells you what to improve.

22. Quantitative Evidence
Capture how much/how often.
Example:
82% completed the task successfully.
Together:
QUALITATIVE
Why?

       +

QUANTITATIVE
How much?

       ↓

STRONGER VALIDATION

23. Hypothesis Evaluation
Every experiment should end with a clear status.
✅ Validated
Evidence supports the hypothesis.
⚠️ Partially Validated
Some assumptions are supported, others aren't.
❌ Invalidated
Evidence contradicts the hypothesis.
❓ Inconclusive
Not enough evidence.

24. Learnings & Insights
Document what you learned.
Use:
We expected X, but observed Y, which means Z.
Example:
We expected retailers to prioritize real-time stock visibility, but observed that they cared more about knowing which products required immediate replenishment. This suggests the solution should prioritize actionable alerts rather than simply displaying inventory data.
This is where experiments become product knowledge.

25. Decision
Every experiment should result in an explicit decision.
         EXPERIMENT
               │
      ┌────────┼────────┐
      ▼        ▼        ▼
   PROCEED   ITERATE    STOP
      │        │        │
      ▼        ▼        ▼
   Build     Retest   Abandon
You can also use:
Scale
Iterate
Run another experiment
Pivot
Defer
Stop

26. Iteration
If the hypothesis isn't validated, don't automatically abandon the opportunity.
Ask:
What specifically failed?
It could be:
Problem assumption
Customer segment
Value proposition
UX
Pricing
Solution concept
Technical implementation
Then formulate the next experiment.

27. Experiment Log
Maintain a centralized record:
Experiment
Hypothesis
Method
Result
Decision
E001
Users need stock visibility
Interviews
Validated
Prototype
E002
Dashboard is understandable
Usability test
Partial
Iterate
E003
Users will adopt alerts
Prototype
Invalidated
Redesign
E004
Customers will pay ₦X
Pricing test
Inconclusive
Further test

This becomes an incredibly valuable organizational learning repository.

28. Validation Report
The final output should consolidate everything:
VALIDATION REPORT
│
├── Problem
├── Opportunity
├── Solution
├── Hypotheses
├── Assumptions
├── Experiments
├── Evidence
├── Results
├── Learnings
├── Risks
├── Validated Assumptions
├── Invalidated Assumptions
├── Remaining Unknowns
├── Recommendation
└── Decision
Where it fits in your overall framework
You now have:
MARKET RESEARCH
       ↓
PROBLEM DISCOVERY
       ↓
PROBLEM DEFINITION
       ↓
CUSTOMER RESEARCH
       ↓
OPPORTUNITY ASSESSMENT
       ↓
PRODUCT DISCOVERY
 / SOLUTION DESIGN
       ↓
VALIDATION & EXPERIMENTATION
       ↓
MVP DEFINITION
       ↓
PRODUCT STRATEGY
       ↓
ROADMAP
       ↓
DELIVERY / EXECUTION
       ↓
MEASURE
       ↓
LEARN
