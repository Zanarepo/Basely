2.4 Risk Register
Document Owner: Project Manager
Status: Draft
Version: 1.0
Related Documents
Project Charter
Stakeholder Register
Communication Plan
Release Plan

1. Purpose
The Risk Register identifies potential events that could negatively impact the Sellytics Inventory Platform project. It records the likelihood and impact of each risk, defines mitigation strategies, assigns ownership, and tracks the status of each risk throughout the project lifecycle.

2. Risk Management Approach
The project will follow a proactive risk management process:
Identify risks.
Assess probability and impact.
Prioritize risks.
Define mitigation and contingency plans.
Assign a risk owner.
Monitor and review risks throughout the project.

3. Risk Assessment Matrix
Probability Scale
Rating
Description
1
Very Low
2
Low
3
Medium
4
High
5
Very High


Impact Scale
Rating
Description
1
Negligible
2
Minor
3
Moderate
4
Major
5
Critical


Risk Priority
Score
Priority
1–5
Low
6–10
Medium
11–15
High
16–25
Critical


4. Risk Register
ID
Risk
Category
Probability
Impact
Score
Priority
Mitigation
Contingency
Owner
Status
R-001
Scope creep due to uncontrolled feature requests
Scope
4
5
20
Critical
Maintain change control process and prioritize backlog
Move new requests to future releases
Project Manager
Open
R-002
Delays in development due to technical complexity
Technical
4
4
16
Critical
Break work into smaller stories and conduct technical spikes
Re-plan sprint and adjust release dates
Technical Lead
Open
R-003
Database design changes impacting existing features
Technical
3
5
15
High
Review and approve schema before implementation
Perform controlled database migrations
Technical Lead
Open
R-004
Security vulnerabilities in authentication
Security
3
5
15
High
Conduct security reviews and testing
Apply security patches immediately
Technical Lead
Open
R-005
Low user adoption after MVP release
Business
3
4
12
High
Validate features through user feedback and pilot testing
Enhance onboarding and training
Product Manager
Open
R-006
Infrastructure outages affecting system availability
Infrastructure
2
5
10
Medium
Deploy to reliable cloud infrastructure with monitoring
Restore service from backups and failover procedures
DevOps Engineer
Open
R-007
Third-party service interruptions (Supabase, email providers)
External
2
4
8
Medium
Monitor service status and design for graceful degradation
Use backups or alternative providers where feasible
DevOps Engineer
Open
R-008
Poor data quality during migration from spreadsheets
Data
3
4
12
High
Validate imported data and provide templates
Roll back import and correct data
Product Manager
Open
R-009
Limited stakeholder availability for reviews and approvals
Stakeholder
3
3
9
Medium
Schedule reviews in advance
Escalate delays to sponsor
Project Manager
Open
R-010
Performance degradation as data volume increases
Performance
3
4
12
High
Conduct performance testing and optimize queries
Scale infrastructure and optimize indexes
Technical Lead
Open


5. Top Project Risks
The following risks require immediate attention throughout the project:
Scope creep.
Technical complexity.
Authentication and security issues.
User adoption.
Data migration quality.
These risks should be reviewed during each Sprint Review and Release Planning session.

6. Risk Response Strategies
Strategy
Description
Example
Avoid
Eliminate the risk entirely
Remove a high-risk feature from the MVP
Mitigate
Reduce probability or impact
Add automated testing to reduce defects
Transfer
Shift responsibility to another party
Use a managed cloud provider for infrastructure
Accept
Acknowledge the risk and monitor it
Minor UI enhancements deferred to a later release


7. Risk Monitoring
The Project Manager will:
Review the Risk Register weekly.
Update risk status after each sprint.
Escalate Critical risks immediately.
Add newly identified risks throughout the project.

8. Risk Escalation Process
Priority
Action
Low
Monitor during weekly reviews
Medium
Discuss during Sprint Planning or Review
High
Escalate to Product Manager and Technical Lead
Critical
Escalate immediately to Executive Sponsor and adjust project plans if necessary


9. Risk Review Schedule
Activity
Frequency
Owner
Risk Identification
Ongoing
Entire Project Team
Risk Review
Weekly
Project Manager
Risk Assessment Update
End of Each Sprint
Project Manager
Executive Risk Review
Monthly
Executive Sponsor


10. Approval
Role
Responsibility
Project Manager
Author
Product Manager
Review
Executive Sponsor
Approval


💡 TPM Best Practice
In mature software teams, the Risk Register is often linked directly to Jira. If a risk materializes, it becomes an Issue (a real problem), and the mitigation work is tracked through Jira tasks or stories.
Example:
Risk:
Authentication service may have security vulnerabilities.

↓

Mitigation Task (Jira):
Perform security review of authentication module.

↓

Story:
Implement password reset with secure token validation.

↓

Sprint 2
This creates traceability from risk → mitigation → delivery.

