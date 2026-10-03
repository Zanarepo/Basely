1. Smart AI Task Assignment (Deliverables & Execution)
Right now, assigning tasks is a manual guessing game. If the matrix is integrated into your Work Breakdown Structure (WBS) and deliverables, the AI can act as your Resource Manager.

How it works: When you create a new deliverable (e.g., "Build Auth System"), the AI scans the required skills (e.g., Node.js, Security) and automatically looks at the Capacity Matrix. It finds the person with the right Skills, checks their Bandwidth Config to ensure they aren't overworked, and suggests them for the task.

2. Predictive Sprint & Schedule Planning
The "Target Sprint Velocity" and "Available Weekly Hours" shouldn't just be numbers on a screen; they should dictate the schedule.

How it works: When you are planning a sprint or a milestone, the AI tallies up the total velocity points available from the matrix (e.g., 60 points total for the team). If you try to schedule 80 points of deliverables into that timeframe, the AI will immediately flag a Capacity Risk and prevent you from setting an unrealistic deadline.

3. Dynamic Workload Rebalancing
Project execution is messy. People get sick, or tasks take longer than expected.

How it works: If a team member falls behind, the AI can check the Capacity Matrix for someone else who shares the exact same "Competencies" and currently has spare bandwidth. It can proactively prompt you: "Alex is overloaded this week. Elena has the required React skills and 10 hours of free bandwidth. Would you like me to move this task to Elena?"


4. Skill Gap Analysis (Forward Planning)
As you map out future phases of your project in the WBS, the AI can look ahead and compare your future needs against your current Capacity Matrix.

How it works: The AI can warn you weeks in advance: "Phase 3 requires Heavy Data Science work. Based on the matrix, Marcus is your only data scientist and his bandwidth is fully booked. You need to hire a contractor or allocate another resource before Phase 3 begins."





======================================================
New imlemtnation
=======================================================

ADR Workflow Integration & Optimization Plan
Goal Description
Currently, the Architecture Decision Records (ADR) module acts as a standalone ledger. While valuable for documentation, it sits isolated from the actual execution of the project. This plan proposes integrating ADRs directly into the upstream and downstream project workflows (WBS, RAID, and Capacity Planning) and leveraging AI to automatically enforce these architectural decisions. We will also implement strict feature gating based on user tiers.

User Review Required
IMPORTANT

Please review the proposed AI workflows and integration points below. Let me know which of these features you want prioritized for implementation first.

Open Questions
Auto-Creation vs. Suggestions: When the AI extracts Risks/Assumptions from an ADR, should it automatically create them in the RAID log, or should it just suggest them to the user for approval first?
Database Schema: We will need to add a linked_adr_ids array column to the wbs_elements and raid_log_entries tables. Is it okay to create a new database migration for this?
Proposed Integrations & Workflow


1. WBS Linkage & AI Compliance (Execution Alignment)
Concept: Architecture decisions directly constrain how work is done.
Workflow: WBS elements will have a new field to link them to relevant ADRs.
AI Leverage: A "Check Compliance" AI button on WBS tasks. The AI reads the task description and cross-references it with linked ADRs to ensure the implementation plan doesn't violate architectural constraints (e.g., preventing a developer from proposing a REST API when an ADR mandates GraphQL).
Tier Gating: Manual linking available to all. AI Compliance Check requires Premium (uses ai_generations_count).


2. RAID Extraction (Risk Management)
Concept: Every major architectural decision introduces new Risks, Assumptions, or Dependencies (e.g., "We assume the vendor API handles 10k RPS").
Workflow: When an ADR status changes to "Accepted", an AI agent scans the "Consequences" and "Context" sections.
AI Leverage: The AI automatically extracts these points and stages them as draft entries in the Enterprise RAID Command Center.
Tier Gating: Requires Enterprise tier (uses ai_basic_actions_count).


3. Skill Gap Trigger (Capacity Planning)
Concept: Deciding to adopt a new technology means the team must know how to use it.
Workflow: When an ADR introduces a new tech stack (e.g., "Migrate to Kubernetes"), the AI cross-references the tech mentioned against the Team Capacity Matrix.
AI Leverage: If the required skill is missing from the team, the AI immediately flags a "Skill Deficit Warning" on the ADR itself, prompting the PM to hire a contractor or allocate training time.
Tier Gating: Requires Premium tier (uses ai_generations_count).
Proposed Changes
Database Modifications
[NEW] supabase/migrations/[timestamp]_add_adr_linkages.sql
Add linked_adr_ids (text array) to wbs_elements table.
Add source_adr_id (uuid) to raid_log_entries table.
Data Layer
[MODIFY] src/lib/adr/actions.ts
Add functions to fetch ADRs by linked WBS/RAID elements.
AI & Logic Layer
[NEW] src/lib/adr/ai-adr-workflow-actions.ts
Implement extractRaidFromAdr(adrId) using generateStructuredJson.
Implement checkWbsCompliance(wbsId) using generateStructuredJson.
Incorporate useAiEntitlements backend validation for all AI calls.
UI Components
[MODIFY] src/components/dashboard/wbs/sidepanel/WbsBasicDetails.tsx
Add an ADR multi-select field.
Add "Verify Architecture Compliance" AI button (guarded by useAiEntitlements).
[MODIFY] src/components/dashboard/projects/adr/AdrStudioModal.tsx
Add a "Scan for Risks & Skills" AI button that triggers the RAID extraction and Skill Gap check upon ADR approval.
Verification Plan
Automated Tests
N/A (Standard Next.js build validation)
Manual Verification
Create an ADR mandating "PostgreSQL".
Create a WBS task proposing "MongoDB setup".
Run the AI Compliance Check and verify it flags the violation.
Verify that clicking the AI buttons on a Free tier account successfully blocks the action and shows the Upgrade Modal.