Product Requirements Document (PRD)
Sprint 6: Cost Core — Resource Rates

1. Objective & Scope
The objective of Sprint 6 is to build resource cost management — labor rates, material costs, fixed costs, and overhead — and the assignment mechanism that connects resources to schedule activities to produce a real, bottom-up planned cost.
By the end of this sprint, a Project Manager will be able to:
Define cost rates for labor, materials, and fixed costs
Configure overhead as a percentage applied on top of direct costs
Assign resources to schedule activities with a quantity, hours, or flat allocation
See planned cost calculated automatically and rolled up into the Sprint 5 budget — including reconciling any "pending" bottom-up estimates left over from that sprint
Out of scope for this sprint: actual cost tracking (Sprint 7) and EVM metrics (Sprint 8) — this sprint only strengthens the planned side of the cost equation, replacing manual guesses with resource-driven calculation.
Hard dependency: This sprint requires Sprint 3 (Schedule / CPM Engine) for the activities that resources get assigned to, and Sprint 5 (Budget Baseline) for the cost_accounts that resource-calculated costs will reconcile against. It does not require Sprint 5's baselines to be final — reconciliation is designed to handle live, in-progress budgets.

2. User Stories
As a Project Manager, I want to define rates for my labor, materials, and fixed costs, so that I can build an accurate bottom-up budget instead of guessing at totals.
As a Project Manager, I want to assign resources to activities with a quantity or number of hours, so that the system calculates planned cost automatically instead of me doing the math by hand.
As a Project Manager, I want overhead applied automatically according to a configured percentage, so that my budget reflects true cost, not just raw labor and material spend.
As a Project Manager, I want a bottom-up estimate I entered manually in Sprint 5 to be reconciled against the real resource-calculated total once I've assigned resources, so that I'm alerted to the difference instead of having my input silently overwritten.

3. Functional Requirements
3.1 Resource Types & Rates
Support three resource types, each with its own rate structure:
Labor: rate per hour or per day
Material: rate per unit
Fixed cost: a flat amount, not tied to duration or quantity
Each resource rate is recorded with a currency, consistent with the multi-currency handling established in Sprint 5.
Resource rates are reusable across activities and projects within the same workspace (a "labor rate for a Senior Engineer" should be definable once, not re-entered per assignment).
3.2 Overhead
Support a configurable overhead percentage, applicable at the project level or per resource type.
Overhead is applied on top of direct costs (labor + material), and must be clearly broken out — never silently folded into the direct-cost number so a PM can't see what's overhead vs. direct spend.
3.3 Resource-to-Activity Assignment
Assign a resource (with its rate) to a schedule activity (from Sprint 3), specifying a quantity — hours for labor, units for material, or a flat allocation for fixed cost.
Calculate the assignment's planned cost automatically: rate × quantity, plus applicable overhead.
Support multiple resource assignments per activity (e.g., two different labor roles plus one material line on the same activity).
3.4 Roll-Up & Reconciliation
Roll up all resource assignment costs for an activity, through its linked WBS element, into that work package's cost_account from Sprint 5.
When a work package's cost account has an estimation method of bottom_up and a reconciliation_status of "pending" (set in Sprint 5), compare the manually-entered total against the newly-calculated resource-based total:
If they differ, flag the variance for the PM to review and confirm — do not silently overwrite.
Once confirmed, update the cost account's budgeted_total to the resource-calculated figure and clear the pending flag.
For work packages using analogous or parametric estimation methods, resource assignments are still trackable (useful for later actuals comparison in Sprint 7) but do not automatically override the estimation method's total — reconciliation logic is bottom-up-specific.
3.5 Multi-Currency
Resource rates and calculated assignment costs respect the same currency-conversion behavior decided for Sprint 5 (rate-locked-at-baseline vs. live-rate-at-report-time), applied consistently.

4. Acceptance Criteria
A PM can define at least one rate of each resource type (labor, material, fixed) and assign them to activities, with the calculated planned cost matching a manually computed total exactly.
Changing a resource's rate correctly recalculates planned cost for every activity assignment using that resource, without requiring a manual recalculation trigger.
Overhead percentage is correctly applied and clearly broken out (direct cost vs. overhead) in every roll-up view.
A bottom-up cost account marked "pending reconciliation" in Sprint 5 correctly surfaces a variance flag when its resource-calculated total differs from the manual estimate, and correctly updates only after explicit PM confirmation.

5. Non-Functional & Security Requirements
Requirement
Detail
Data Isolation
resource_rates and activity_resource_assignments must inherit the same project-scoped RLS pattern established in Sprints 1–3, consistent with Sprint 5's budget tables.
Correctness
Calculated assignment cost (rate × quantity + overhead) must always match a manual recalculation exactly — no rounding drift accumulating across large numbers of assignments.
Data Integrity
Reconciliation must never silently overwrite a PM-entered bottom-up total — this is a hard requirement, not a UX nicety, since silent overwrites would undermine trust in every subsequent budget number.
Performance
Recalculating all resource-assignment costs for a 5,000-activity project (matching the CPM/EVM performance bar from Sprints 3 and 8) must complete in a time that doesn't block the UI — target under 2 seconds.
Extensibility
Schema must not block Sprint 7 (Actuals) from later comparing actual cost against a specific activity_resource_assignment, or Sprint 8 (EVM) from reading resource-calculated planned cost as part of Planned Value.


6. Implementation Task Breakdown: Sprint 6
[Phase 1: Resource Rate Schema & RLS] ──> [Phase 2: Rate Management UI] ──> [Phase 3: Overhead Configuration] ──> [Phase 4: Assignment & Cost Calculation] ──> [Phase 5: Roll-Up & Reconciliation]
Phase 1: Resource Rate Schema & Row Level Security
Goal: Provision the tables for resource rates and assignments, linked to the schedule (Sprint 3) and budget (Sprint 5) layers already in place.
Task 1.1: Design Resource Rate Schema
Create a SQL migration for public.resource_rates (id, project_id, name, type enum [labor/material/fixed], rate, unit, currency).
Task 1.2: Design Assignment Schema
Create public.activity_resource_assignments (id, activity_id FK, resource_rate_id FK, quantity, calculated_cost).
Task 1.3: Configure Row Level Security
Enable RLS on both tables, reusing the organization_members-scoped pattern from Sprints 1–3 and matching the write-restriction default established for budget data in Sprint 5.
Phase 2: Resource Rate Management UI
Goal: Let a PM define and manage reusable resource rates.
Task 2.1: Build Resource Rate CRUD
Form for creating/editing/deleting resource rates, with type-specific fields (rate/hour or /day for labor, rate/unit for material, flat amount for fixed).
Task 2.2: Build Resource Rate List View
A reusable, searchable list of all resource rates defined for the project/workspace, so PMs aren't re-creating the same rate repeatedly.
Phase 3: Overhead Configuration
Goal: Let overhead be configured once and applied consistently and transparently.
Task 3.1: Build Overhead Settings
Configuration UI for setting an overhead percentage at the project level (and optionally per resource type, if product decides finer granularity is needed — see Section 8).
Task 3.2: Apply Overhead in Calculations
Ensure every cost calculation that includes direct labor/material cost also computes and separately displays the overhead amount.
Phase 4: Resource-to-Activity Assignment & Cost Calculation
Goal: Build the core assignment mechanism and its automatic cost calculation.
Task 4.1: Build Assignment UI
Interface for assigning one or more resources to a schedule activity, entering a quantity (hours/units/flat) per assignment.
Task 4.2: Implement Cost Calculation
Calculate calculated_cost per assignment (rate × quantity + applicable overhead), recalculating automatically whenever the rate or quantity changes.
Task 4.3: Support Multiple Assignments per Activity
Ensure the UI and data model cleanly support several resource lines on a single activity, with a per-activity subtotal.
Phase 5: Roll-Up & Bottom-Up Reconciliation
Goal: Connect resource-calculated costs back into the Sprint 5 budget structure, resolving the "pending reconciliation" state left by bottom-up placeholders.
Task 5.1: Build Roll-Up Logic
Aggregate all resource assignment costs for an activity, through its WBS element, into the corresponding cost_account.
Task 5.2: Implement Reconciliation Variance Detection
For bottom_up/pending cost accounts, compare the manual budgeted_total against the newly rolled-up resource total and surface a variance if they differ.
Task 5.3: Build Reconciliation Confirmation UI
Present the variance to the PM with the two numbers side by side; on confirmation, update budgeted_total and clear the reconciliation_status flag.

7. Sprint Delivery Milestones
Milestone 1 — Resource Data Layer Live (Target: Day 3) resource_rates and activity_resource_assignments tables deployed with RLS confirmed, consistent with Sprint 5's write-access defaults.
Milestone 2 — Rate Management & Overhead Working (Target: Day 6) PMs can create/edit all three resource types; overhead is configured and correctly broken out separately from direct cost in any calculation.
Milestone 3 — Assignment & Live Cost Calculation (Target: Day 9) Resources can be assigned to activities with quantities; calculated cost updates automatically on rate or quantity change, with no manual recalculation step, across multiple assignments per activity.
Milestone 4 — Roll-Up, Reconciliation & Sprint Sign-Off (Target: Day 12) Resource costs correctly roll up into Sprint 5's cost accounts; bottom-up reconciliation correctly flags variances and only updates totals after explicit PM confirmation; all Section 4 acceptance criteria pass.

8. Open Questions Carried Into This Sprint
Overhead granularity: is a single project-level overhead percentage sufficient for launch, or is per-resource-type overhead (e.g., different overhead for labor vs. material) required? Adding granularity later is a straightforward schema extension, so defaulting to project-level-only for this sprint is reasonable unless there's a known customer requirement otherwise.
Resource rate reusability scope: should resource rates be reusable across all projects within a workspace/organization (a shared rate card), or scoped strictly to a single project? A shared rate card is more useful for consistency but adds a layer of workspace-level data modeling not yet defined — worth confirming before Task 1.1 finalizes the schema's project_id vs. organization_id scoping.
Reconciliation for non-bottom-up methods: Section 3.4 currently keeps analogous/parametric cost accounts untouched by resource-based roll-up. Confirm this is the desired behavior, or whether PMs should be able to optionally switch a cost account's estimation method to bottom-up after the fact once resource assignments exist.
Assignment-level currency mismatches: if a resource rate's currency differs from the cost account's currency, does conversion happen at assignment time or roll-up time? Should follow whatever timing decision was made for Sprint 5 (Section 8 of that sprint's PRD), but worth an explicit cross-check since assignments introduce a second currency touch-point.

End of Sprint 6 PRD. This sprint completes the planned side of the cost equation — budget (Sprint 5) is now backed by real resource-driven calculation. Sprint 7 (Actuals) introduces the real-world spending data that gets compared against everything built in Sprints 5–6, and Sprint 8 (EVM Engine) is what finally makes that comparison meaningful.

