# Product Requirements Document (PRD)
# Sprint 8: Earned Value Management (EVM)

## 1. Objective & Scope
The objective of Sprint 8 is to implement Earned Value Management (EVM), the gold standard in project performance measurement. This sprint acts as the capstone of the cost and schedule modules by combining **Sprint 3 (Schedule Progress)**, **Sprint 5 (Budget/Time-Phasing)**, and **Sprint 7 (Actuals)** into a single analytical engine.

By the end of this sprint, a Project Manager will be able to:
* View core EVM metrics (PV, EV, AC) for any Work Package or the entire project.
* Instantly see performance indices (CPI, SPI) and variances (CV, SV) to know if a project is over/under budget and ahead/behind schedule.
* View forecasting metrics like Estimate at Completion (EAC) and Variance at Completion (VAC).
* Visualize performance trends over time using an S-Curve chart that overlays PV, EV, and AC.

**Hard dependency:** This sprint strictly relies on the `percent_complete` from activities, the `time_phase` entries from budgets, and the `amount` and `date` from actual costs.

## 2. User Stories
* **As a Project Manager**, I want to see my Cost Performance Index (CPI) and Schedule Performance Index (SPI) on my dashboard, so I know at a glance if my project is healthy.
* **As a Project Manager**, I want the system to calculate Earned Value (EV) automatically based on schedule progress and the baseline budget, so I don't have to do manual spreadsheet math.
* **As a Project Manager**, I want to see a forecasted Estimate at Completion (EAC), so I can warn stakeholders early if we are trending toward a budget overrun.
* **As a Project Manager**, I want an S-Curve chart plotting PV, EV, and AC, so I can visually present the project's financial trajectory in reports.

## 3. Functional Requirements

### 3.1 Core EVM Calculations
The system must calculate the following base values for any given "status date" (usually today):
* **Planned Value (PV)**: The sum of all time-phased budget entries scheduled to be completed on or before the status date.
* **Actual Cost (AC)**: The sum of all actual costs recorded on or before the status date.
* **Earned Value (EV)**: The baseline budget of a WBS element multiplied by its current `percent_complete`.

### 3.2 Performance Metrics & Variances
Using the base values, the system must calculate:
* **Cost Variance (CV)** = EV - AC (Negative = Over budget)
* **Schedule Variance (SV)** = EV - PV (Negative = Behind schedule)
* **Cost Performance Index (CPI)** = EV / AC (< 1.0 = Over budget)
* **Schedule Performance Index (SPI)** = EV / PV (< 1.0 = Behind schedule)

### 3.3 Forecasting Metrics
* **Budget at Completion (BAC)** = Total baseline budget.
* **Estimate at Completion (EAC)** = BAC / CPI (Predicts total cost if current spending efficiency continues).
* **Estimate to Complete (ETC)** = EAC - AC (How much more money is needed to finish).
* **Variance at Completion (VAC)** = BAC - EAC (Predicted final overrun/underrun).

### 3.4 EVM Dashboard & UI
* Provide a new "Performance" or "EVM" tab within the Cost Workspace.
* Display high-level KPI cards for CPI, SPI, EAC, and CV with color-coding (e.g., Green for >= 1.0, Red for < 1.0).
* Render a detailed table showing EVM metrics broken down by WBS element.

### 3.5 S-Curve Visualization
* Implement a line chart (using Recharts or similar) plotting cumulative PV, EV, and AC over time.
* The X-axis represents time (from project start date to end date).
* The Y-axis represents cumulative cost.

## 4. Acceptance Criteria
* The EVM engine correctly calculates PV, EV, and AC for a sample project based on known test data.
* CPI and SPI are calculated to two decimal places and display appropriate visual health indicators (red/green).
* Forecasting metrics (EAC, VAC) accurately reflect standard EVM formulas.
* The S-Curve chart accurately plots the intersection of time and cost for the three main metrics.

## 5. Implementation Task Breakdown: Sprint 8
* **Task 8.1: EVM Calculation Engine**
  * Create `src/lib/cost/evm.ts` to house pure functions for calculating PV, EV, AC, and the derivative metrics.
  * Write utility functions to aggregate time-phased data up to a specific status date.
* **Task 8.2: KPI Cards & Dashboard UI**
  * Create an `EVMDashboard.tsx` component.
  * Build the top-level KPI summary cards (SPI, CPI, CV, SV, EAC).
* **Task 8.3: WBS Performance Table**
  * Build a table that breaks down EVM metrics per Work Package, allowing PMs to pinpoint exactly which area is causing a variance.
* **Task 8.4: S-Curve Chart Integration**
  * Use a charting library to render the cumulative PV, EV, and AC curves.
  * Ensure the chart responds dynamically to the active project data.
