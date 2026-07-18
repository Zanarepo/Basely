Product Requirements Document (PRD)
Sprint 3: Planning Core — Schedule / CPM Engine (Headless)

1. Objective & Scope
The objective of Sprint 3 is to build the Critical Path Method (CPM) scheduling engine — the calculation core that turns a WBS into a live, date-accurate project schedule.
By the end of this sprint, the system will be able to:
Convert WBS work packages into schedulable activities with dependencies, constraints, and calendars
Automatically calculate Early Start/Finish, Late Start/Finish, float, and the critical path
Keep all of the above correct and current the instant anything changes — no manual recalculation
Save baselines and report schedule variance against them
Out of scope for this sprint: the Gantt chart UI. This sprint is deliberately headless — the engine is built and validated against a known-correct reference schedule before any visual layer is built on top of it. Debugging CPM math is much faster in isolation than through a rendered chart, and this sequencing protects the sprint's highest-risk item (calculation correctness) from being tangled up with UI work.
Hard dependency: This sprint requires Sprint 2 (WBS Data Model & Tree UI) to be complete. Every schedule activity is created from a WBS "work package" element (wbs_elements.is_work_package = true), so the WBS schema and hierarchy engine must already be stable.

2. User Stories
As a Project Manager, I want to convert my WBS work packages into schedule activities, so that I can turn my scope breakdown into a real timeline.
As a Project Manager, I want to define dependencies and lag/lead between activities, so that the schedule reflects how work actually has to flow.
As a Project Manager, I want the system to automatically calculate my critical path and float, so that I always know which activities have zero room to slip.
As a Project Manager, I want any change I make — a duration, a dependency, a constraint — to instantly ripple through the whole schedule, so that I'm never looking at stale dates.
As a Project Manager, I want to save a baseline and see variance against it, so that I can tell how far my current plan has drifted from what was originally approved.

3. Functional Requirements
3.1 Activity Data
Every WBS element flagged as a work package can be converted into exactly one schedule activity (1:1 relationship in this phase). Splitting one work package into multiple activities is a future enhancement and is explicitly out of scope now.
Each activity has:
Duration (in days or hours)
Start / finish dates — calculated by the engine, not manually overridden, except for activities with an explicit constraint
% complete
Activity type: Task, Milestone, or Summary (Summary activities auto-roll-up their dates from their children)
Dependency types between activities, each with optional lag/lead (positive or negative, in days):
Finish-to-Start (FS)
Start-to-Start (SS)
Finish-to-Finish (FF)
Start-to-Finish (SF)
Constraint types on individual activities:
As Soon As Possible (default)
Must Start On
Must Finish On
Start No Earlier Than
Finish No Later Than
Calendars:
A default project calendar (working days/hours, holidays)
Optional per-resource calendars, which the engine must respect when calculating dates
3.2 CPM Calculation
Forward pass: calculate Early Start (ES) and Early Finish (EF) for every activity, based on dependencies and calendars.
Backward pass: calculate Late Start (LS) and Late Finish (LF), working back from the project finish date (or a target finish date, if one is set).
Float:
Total Float = LS − ES (equivalently, LF − EF)
Free Float = the amount an activity can slip without delaying its immediate successor
Critical path: the sequence of activities with zero (or the minimum) total float; must be identifiable in the data output so the Gantt UI (next sprint) can visually highlight it.
Live recalculation: a full recalculation must run automatically whenever a duration, dependency, constraint, or calendar changes. There is no manual "recalculate" button — this is a hard requirement, not a nice-to-have.
Circular dependency detection: the engine must detect and reject any dependency that would create a cycle, returning a clear error message that identifies the loop (not just "invalid dependency").
Multiple baselines: a PM can save a baseline snapshot at any point (e.g., at plan approval). The system stores baseline start/finish/duration per activity, and computes schedule variance — current vs. baseline — per activity and rolled up to the project level.

4. Acceptance Criteria
On a known reference schedule (a standard CPM textbook example with a pre-calculated critical path), the engine's output matches expected ES/EF/LS/LF/float values exactly.
Changing one activity's duration correctly cascades date changes through all dependent successors and correctly recalculates the critical path.
A dependency change that would create a cycle is rejected with an explanatory error before it's saved — never after.

5. Non-Functional & Security Requirements
Requirement
Detail
Performance
Full CPM recalculation on a 5,000-activity schedule must complete in under 2 seconds (matches the parent PRD's non-functional requirement).
Correctness
This is the highest-risk technical item in the entire platform. Every later module (budget, RACI, reporting) depends on the schedule being right — "roughly correct" is not acceptable. Engine output must be validated against reference schedules before sign-off.
Data Isolation
activities, dependencies, calendars, and baselines must inherit the same project-scoped RLS pattern established in Sprint 1/2 — no cross-project or cross-tenant access.
Data Integrity
Circular dependencies must be structurally rejected at the point of the write, not merely flagged afterward by a background check.


6. Implementation Task Breakdown: Sprint 3
This breakdown covers building the schedule data model, the CPM calculation engine, and baseline/variance logic — entirely headless, with no UI in this sprint.
[Phase 1: Schedule Data Model] ──> [Phase 2: CPM Calculation Engine] ──> [Phase 3: Live Recalc & Validation] ──> [Phase 4: Baselines & Variance] ──> [Phase 5: Reference Validation & QA]
Phase 1: Schedule Data Model — Activities, Dependencies, Calendars, Constraints
Goal: Provision the tables that hold schedule data, linked to the WBS from Sprint 2, with the same tenant-isolation guarantees as the rest of the platform.
Task 1.1: Design Activity & Dependency Schema
Create a SQL migration for public.activities (id, project_id, wbs_element_id FK, name, type enum [Task/Milestone/Summary], duration, es, ef, ls, lf, total_float, free_float, percent_complete, constraint_type, constraint_date, calendar_id).
Create public.dependencies (id, predecessor_activity_id, successor_activity_id, type enum [FS/SS/FF/SF], lag_days).
Task 1.2: Design Calendar Schema
Create public.calendars (id, project_id, name, working_days, holidays, is_default).
Support optional linkage of a calendar to a resource for per-resource calendar overrides.
Task 1.3: Enforce Row Level Security
Enable RLS on activities, dependencies, and calendars, reusing the organization_members-scoped pattern from Sprint 1/2.
Restrict write access to Admin/PM roles.
Task 1.4: Build WBS-to-Activity Conversion
Build the function/endpoint that converts a WBS work package (is_work_package = true) into a linked activity record, enforcing the 1:1 relationship.
Phase 2: CPM Calculation Engine
Goal: Implement the core forward/backward pass algorithm that produces correct dates, float, and critical path.
Task 2.1: Implement Forward Pass
Calculate Early Start / Early Finish for every activity, respecting dependency type, lag/lead, and calendar working time.
Task 2.2: Implement Backward Pass
Calculate Late Start / Late Finish, working back from the project (or target) finish date.
Task 2.3: Calculate Float & Critical Path
Compute Total Float and Free Float per activity.
Flag activities with zero (or minimum) total float as critical, and expose this in the data output for the future Gantt UI to consume.
Task 2.4: Implement Constraint Handling
Support all five constraint types (ASAP, Must Start On, Must Finish On, Start No Earlier Than, Finish No Later Than) correctly interacting with the forward/backward pass.
Phase 3: Live Recalculation & Validation
Goal: Make the engine reactive — every relevant change triggers a full, correct recalculation automatically — and make invalid states impossible to save.
Task 3.1: Wire Automatic Recalculation Triggers
Trigger a full recalculation whenever a duration, dependency, constraint, or calendar changes, with no manual "recalculate" action required.
Task 3.2: Implement Circular Dependency Detection
Detect cycles before a dependency is committed; reject the write and return an error message that identifies the specific loop (e.g., "Activity A → B → C → A").
Task 3.3: Performance Optimization
Profile and optimize recalculation so a 5,000-activity schedule recalculates in under 2 seconds; scope recalculation to affected subgraphs where possible rather than always recalculating the entire schedule.
Phase 4: Baselines & Variance
Goal: Let a PM freeze a version of the schedule and measure drift against it over time.
Task 4.1: Build Baseline Snapshot Logic
Create public.baselines (id, project_id, name, saved_at) and public.baseline_activity_snapshots (baseline_id, activity_id, baseline_start, baseline_finish, baseline_duration).
Support saving multiple named baselines per project (e.g., "Approved Plan," "Q3 Re-baseline").
Task 4.2: Build Variance Calculation
Compute schedule variance (current vs. baseline) per activity, and roll it up to a project-level summary.
Phase 5: Reference Validation & QA
Goal: Prove the engine is correct before anything is built on top of it.
Task 5.1: Build Reference Schedule Test Suite
Encode at least one standard CPM textbook example with known ES/EF/LS/LF/float values, and assert the engine's output matches exactly.
Task 5.2: Cascade & Critical Path Regression Tests
Test that a single duration change correctly cascades through all successors and correctly recalculates the critical path.
Task 5.3: Circular Dependency Regression Tests
Test that cycle-creating dependencies are rejected with a correct, explanatory error in all tested topologies (direct cycle, indirect multi-hop cycle).

7. Sprint Delivery Milestones
Milestone 1 — Schedule Data Model Live (Target: Day 3) activities, dependencies, and calendars tables deployed with RLS confirmed; WBS work packages can be converted into linked activity records.
Milestone 2 — Forward/Backward Pass Correct (Target: Day 6) CPM engine's forward and backward pass output matches the reference schedule test suite exactly (ES/EF/LS/LF), including constraint handling.
Milestone 3 — Float, Critical Path & Live Recalculation (Target: Day 9) Total/free float and critical path are correctly calculated and exposed; any duration/dependency/constraint/calendar change triggers automatic recalculation with no manual trigger; circular dependencies are rejected with a clear, loop-identifying error.
Milestone 4 — Baselines, Performance & Sign-Off (Target: Day 12) Baseline save and variance reporting work correctly across multiple schedule changes; a 5,000-activity schedule recalculates in under 2 seconds; full reference-schedule and regression test suite passes.

8. Open Questions Carried Into This Sprint
Per-resource calendars: is full per-resource calendar support required for this sprint, or can it launch with a single project calendar and be added in a later pass? This meaningfully affects the complexity of the forward/backward pass.
Baseline scope: should baseline snapshots capture only start/finish/duration, or also % complete and cost fields (relevant once Sprint 4/Budget exists)? Recommend keeping this sprint's baseline schedule-only, per the parent Phase 2 PRD's scope boundary.
Recalculation scope: should the engine always recalculate the full schedule graph, or is a scoped/incremental recalculation (only affected subgraphs) required to hit the 2-second target at 5,000 activities? Worth a performance spike early in Phase 2 rather than discovering this late in Phase 5.

