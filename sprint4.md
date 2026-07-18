Product Requirements Document (PRD)
Sprint 4: Planning Core — Gantt Chart UI

1. Objective & Scope
The objective of Sprint 4 is to build the Gantt chart — the visual, interactive layer that sits on top of the headless CPM engine from Sprint 3 and makes scheduling usable for a Project Manager who doesn't know (or care about) CPM theory.
By the end of this sprint, a Project Manager will be able to:
See their full schedule as a Gantt chart, grouped by WBS hierarchy
Build and edit a schedule entirely by dragging bars — no table/grid view required
See critical path and float at a glance, and compare current dates against a saved baseline
Zoom, pan, collapse/expand, and export the chart for sharing outside the app
Out of scope for this sprint: any further CPM calculation logic (that was fully built and validated in Sprint 3 — this sprint only visualizes and edits data through it) and full document-generation export (this sprint's export is a visual snapshot only, PDF/PNG — formatted, data-driven documents are a later phase).
Hard dependency: This sprint requires Sprint 3 (Schedule / CPM Engine) to be complete and validated. This sprint does not implement any scheduling math — it renders and edits data that the Sprint 3 engine calculates, and every interaction in this sprint calls back into that engine to recalculate.

2. User Stories
As a Project Manager, I want to see my whole schedule as a visual Gantt chart grouped by WBS, so that I can understand my plan's shape at a glance instead of reading a table of dates.
As a Project Manager, I want to build my schedule by dragging bars and drawing dependency lines, so that I never have to leave the visual view or learn a separate data-entry screen.
As a Project Manager, I want critical path activities and float to be visually obvious, so that I instantly know which tasks have zero room to slip.
As a Project Manager, I want to compare my current schedule against a saved baseline right on the chart, so that I can see exactly how far — and where — my plan has drifted.
As a Project Manager, I want to zoom, collapse groups, and export the chart, so that I can work at the right level of detail and share a clean view with stakeholders.

3. Functional Requirements
3.1 Chart Rendering
Render all activities as bars positioned by their calculated start/finish dates.
Group and indent bars to mirror the WBS hierarchy from Sprint 2.
Milestone activities render as diamonds, not bars.
Summary (parent) activities render as a rolled-up bar spanning the full date range of their children.
Critical path activities are visually distinguished (e.g., a distinct color) from non-critical activities.
Float is visible on non-critical activities — e.g., a lighter "float" extension shown past the end of the bar.
3.2 Interactive Editing
Drag a bar to change its dates, respecting any constraint set on that activity.
Drag the edge of a bar to change its duration.
Draw a line between two bars to create a dependency between them.
Every one of the above actions triggers a live CPM recalculation through the Sprint 3 engine — there is no separate "save and recalculate" step.
3.3 Baseline Comparison
Provide a baseline comparison view showing the saved baseline bar alongside the current bar for each activity.
Display variance (days ahead/behind) per activity directly on the chart.
3.4 Navigation & Layout Controls
Zoom/pan controls supporting day, week, month, and quarter views.
Collapse/expand WBS groupings directly within the Gantt tree (mirroring the same interaction from the Sprint 2 tree UI).
3.5 Export
Print/export the current Gantt view to PDF and PNG.
This is a visual snapshot export only — full data-driven document generation (e.g., a formatted schedule report) is out of scope and belongs to a later Documentation Engine phase.
3.6 Device Support
Must be usable on tablet-sized screens, including touch drag-and-drop for bars.
Full mobile phone support is not required in this phase — this matches the parent PRD's broader mobile-responsive-web-only scope, and is a lower priority for the Gantt view specifically given how dense the chart is.

4. Acceptance Criteria
A PM can build a complete 20-activity schedule (create activities, set durations, draw dependencies) using only the Gantt UI, without touching a table/grid view, in under 20 minutes.
Dragging a bar to a new date correctly reflows all dependent activities on screen within 500ms for a 200-activity schedule.
Baseline vs. current variance is correctly displayed for every activity after a baseline save followed by a schedule change.

5. Non-Functional & Security Requirements
Requirement
Detail
Performance
Bar drag interactions must reflow dependent activities on screen within 500ms at 200 activities; chart must remain usable (no visible jank) at 1,000+ activities via virtualized rendering.
Correctness
All dates, float, and critical-path status shown on the chart must always match the Sprint 3 engine's output exactly — the UI must never display a locally-computed or stale value.
Data Isolation
The Gantt UI reads and writes through the same project-scoped, RLS-protected activities/dependencies tables from Sprint 3 — no new data-access pattern is introduced.
Usability
A PM with no prior CPM training should be able to build a schedule through the chart alone (see Acceptance Criteria) — the UI carries the burden of hiding CPM complexity, not user training.


6. Implementation Task Breakdown: Sprint 4
This breakdown covers building the Gantt chart from read-only rendering through full interactive editing, baseline comparison, and export.
[Phase 1: Read-Only Rendering] ──> [Phase 2: Interactive Editing] ──> [Phase 3: Baseline Comparison] ──> [Phase 4: Navigation & Export] ──> [Phase 5: Touch/Tablet & Performance]
Phase 1: Read-Only Gantt Rendering
Goal: Render a correct, static visualization of the Sprint 3 engine's output before any editing interaction is added — the same "prove it renders right before you let people touch it" sequencing used for the CPM engine itself.
Task 1.1: Build the Core Chart Component
Render activity bars positioned by es/ef (or current scheduled dates), grouped and indented to mirror the WBS hierarchy from Sprint 2.
Render Milestone activities as diamonds and Summary activities as roll-up bars spanning their children's date range.
Task 1.2: Implement Critical Path & Float Visualization
Apply distinct styling to activities flagged as critical (total_float = 0 or minimum) by the Sprint 3 engine.
Render a float extension on non-critical bars showing free_float/total_float.
Task 1.3: Row Virtualization
Ensure the chart stays performant at 1,000+ activities using virtualized row rendering (matching the approach used for the WBS tree in Sprint 2).
Phase 2: Interactive Editing
Goal: Layer editing on top of the proven rendering, with every interaction wired live into the Sprint 3 CPM engine.
Task 2.1: Drag-to-Reschedule
Implement dragging a bar horizontally to change its start date, respecting the activity's constraint type; call the CPM engine to recalculate on drop.
Task 2.2: Drag-to-Resize (Duration Change)
Implement dragging a bar's edge to change its duration; call the CPM engine to recalculate on drop.
Task 2.3: Draw-to-Create Dependency
Implement drawing a line between two bars to create a dependency; surface the circular-dependency error from the Sprint 3 engine inline if the new dependency would create a cycle.
Task 2.4: Live Recalculation Wiring
Ensure all three interactions above trigger the engine's live recalculation with no separate save step, and that the chart re-renders updated dates/critical path immediately.
Phase 3: Baseline Comparison View
Goal: Let a PM see schedule drift directly on the chart.
Task 3.1: Render Baseline Bars
Add a toggleable baseline comparison mode showing each activity's saved baseline bar alongside its current bar.
Task 3.2: Display Variance
Show per-activity variance (days ahead/behind) using the baseline data and variance calculation built in Sprint 3.
Phase 4: Navigation, Layout & Export
Goal: Round out the chart with the controls needed for real day-to-day use and stakeholder sharing.
Task 4.1: Zoom/Pan Controls
Implement day/week/month/quarter zoom levels and horizontal pan.
Task 4.2: Collapse/Expand WBS Groupings
Reuse the expand/collapse interaction pattern from the Sprint 2 tree UI directly within the Gantt's grouped rows.
Task 4.3: PDF/PNG Export
Implement visual snapshot export of the current chart view to PDF and PNG. Explicitly scope this as an image/print export, not a data-driven document (that belongs to a later Documentation Engine phase).
Phase 5: Touch/Tablet Support & Performance Validation
Goal: Confirm the chart works well outside of a mouse-and-keyboard desktop context, and holds up under the sprint's performance acceptance criteria.
Task 5.1: Touch Drag-and-Drop
Implement touch-equivalent interactions for drag-to-reschedule, drag-to-resize, and draw-to-create-dependency on tablet-sized screens.
Task 5.2: Performance Testing
Validate the 500ms reflow target on a 200-activity schedule and confirm no visible jank at 1,000+ activities.
Task 5.3: End-to-End Usability Test
Run the Acceptance Criteria's 20-activity, Gantt-only build scenario with target users and confirm the under-20-minutes target is met.

7. Sprint Delivery Milestones
Milestone 1 — Chart Renders Correctly (Target: Day 3) Bars, milestones, summary roll-ups, critical path styling, and float indicators all render correctly and match the Sprint 3 engine's output exactly, with no editing yet.
Milestone 2 — Interactive Editing Wired to Engine (Target: Day 7) Drag-to-reschedule, drag-to-resize, and draw-to-create-dependency all work and correctly trigger live CPM recalculation, including inline circular-dependency error handling.
Milestone 3 — Baseline Comparison Live (Target: Day 9) Baseline bars and per-activity variance display correctly on the chart after a baseline save followed by schedule changes.
Milestone 4 — Navigation, Export & Sprint Sign-Off (Target: Day 12) Zoom/pan, collapse/expand, and PDF/PNG export all work; touch drag-and-drop is functional on tablet; the 20-activity/under-20-minutes and 500ms reflow acceptance criteria both pass in testing.

8. Open Questions Carried Into This Sprint
Dependency-drawing UX: should drawing a dependency snap to fixed anchor points on each bar (start/end only), or support free-form connection points? Fixed anchors are simpler to build and more predictable for FS/SS/FF/SF selection — recommend starting there unless there's a strong UX reason not to.
Baseline comparison default: should the baseline comparison view be a toggle the PM turns on, or shown by default whenever a baseline exists? Affects default screen density, especially on tablet.
Export fidelity: does PDF export need to paginate a long schedule across multiple pages, or is a single wide-canvas export (best viewed digitally) acceptable for this sprint? Worth confirming before Task 4.3, since pagination adds real scope.

End of Sprint 4 PRD. This sprint completes the Planning Core phase (WBS → CPM Engine → Gantt UI). The next phase in the platform's build sequence is Cost Core: budget baseline → resource rates → actuals → EVM engine, per the parent Phase 2 PRD's Section 3.2 boundary and the master PRD's Section 12 build sequence.


