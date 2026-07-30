# Product Requirements Document (PRD)
# Sprint 49: Product Management Suite — OKRs & North Star KPI Engine (Phase 14 Sprint 2)

---

## 1. Objective & Scope

The objective of Sprint 49 (Sprint 2 of the Phase 14 Product Management Suite) is to establish an intuitive, quantitative **OKR (Objectives & Key Results)** framework and **North Star KPI Engine** that directly measures product strategy execution against concrete business outcomes. 

Building directly upon the Product Strategy Canvases and Customer Personas established in Sprint 48, this sprint provides Product Managers and PMO Directors with structured performance metrics, continuous target tracking, and dynamic reporting capabilities natively integrated into the enterprise project governance architecture.

By the end of this sprint, a Product Manager or PMO Director will be able to:
- Define and track a **North Star Metric** along with supporting quantitative input drivers (Acquisition, Activation, Retention, Engagement, Revenue KPIs) scoped to their project or organization workspace.
- Build hierarchical **Objectives & Key Results (OKRs)** featuring continuous progress calculation, confidence scoring (0-100%), status indicators (On Track, At Risk, Behind), and custom dynamic analytical attributes/columns.
- Automatically generate and publish an interactive **OKR & KPI Performance Report** document in the Document Library, complete with auto-filling from active metrics and real-time custom section additions without page reloading.

**Out of scope for this sprint:** automated data pipeline ingestions from external analytics software (e.g., Mixpanel, Amplitude, Google Analytics — scheduled for future Phase 15 integrations) and automated RICE/MoSCoW feature prioritization scoring (scheduled for Sprint 51). This sprint strictly focuses on establishing the native OKR/KPI data framework, UI workspace engines, and document generation pipeline.

> **Hard dependency:** This sprint requires Sprint 48 (Product Strategy & Personas data architecture and Document Library dynamic section infrastructure), Back Office Sprint 29 (multi-tenancy workspace isolation), Documentation Engine Sprint 12 & 38 (templating and document registry), and Governance Sprint 22 (RLS and audit logging).

---

## 2. User Stories

- **As a Product Manager**, I want to define a singular North Star metric along with supporting KPI growth levers, so that engineering teams and stakeholders understand the primary quantitative measure of customer value delivered by our product.
- **As a Product Manager**, I want to establish quarterly Objectives and measurable Key Results with live progress sliders and confidence scores, so that our strategic goals remain actionable, trackable, and transparent across the organization.
- **As a PMO Director or Executive Sponsor**, I want to auto-generate formal OKR & KPI Performance Reports within the Document Library, so that progress summaries inherit version control, approval workflows, collaborative commenting, and multi-format (PDF/DOCX/XLSX) exports.
- **As a Product Manager**, I want the ability to add dynamic custom attributes and text sections to my KPI reports without experiencing page reloads or waiting, so that I can capture unique market nuances or board-specific metrics instantly.

---

## 3. Functional Requirements

### 3.1 North Star KPI Engine
- **Database Schema**: New entity `product_kpis` scoped by `project_id` and `organization_id`.
- **Data Attributes**: KPI Name, Category (`north_star`, `acquisition`, `activation`, `retention`, `revenue`, `efficiency`), Current Value, Target Value, Unit (`percentage`, `currency`, `numeric`, `ratio`), Frequency (`daily`, `weekly`, `monthly`, `quarterly`), Status, Trend Direction, and a flexible `JSONB` column (`custom_attributes`) for user-defined metadata and extra document columns.
- **Visual KPI Dashboard**: Interactive quantitative scorecards with instant optimistic React state updates, clear visual progress bars, and hover-only action controls.

### 3.2 Hierarchical OKR Framework
- **Database Schema**: Relational models `okr_objectives` and `okr_key_results` linked to existing project workspaces and organizational strategy canvases.
- **Data Attributes**:
  - `okr_objectives`: Title, Strategic Pillar ID (linked to Sprint 48 Strategy Pillars), Owner, Timeframe (e.g., Q3 2026), Status, Overall Progress Percentage.
  - `okr_key_results`: Objective ID, Title, Baseline Value, Target Value, Current Value, Confidence Score (0-100%), Status (`on_track`, `at_risk`, `behind`), Measurement Unit, and `JSONB` custom attributes.
- **Interactive UI Tree**: Expandable Objective cards showcasing nested Key Results with direct inline progress updating, spinning loader effects, and instant state reactivity without full-page reloads.

### 3.3 Dynamic Document Registry Integration
- **New Document Template**: Register a new native `document_type` entry: `okr_kpi_performance_report` within the Document Library registry.
- **Auto-Fill Data Resolver**: Implement a dedicated data-binding resolver (`useOkrKpiReportData.ts` & server resolver) that automatically aggregates live North Star metrics, Objective progress totals, and At-Risk Key Results into structured Markdown tables and editable summary blocks.
- **Dynamic Custom Sections**: Fully leverage Sprint 48’s dynamic section builder and `JSONB` free-text content persistence (`__custom_sections`), empowering users to add, edit, and remove dynamic analytical blocks on the fly.
- **Multi-Format Export Pipeline**: Route seamlessly through existing export utilities (PDF/DOCX/XLSX) with zero pipeline structural modifications.

---

## 4. Acceptance Criteria

- [ ] A Product Manager can execute CRUD operations on North Star KPIs, Objectives, and Key Results within their project workspace, with updates persisting across connected clients using clean Supabase channel patterns.
- [ ] Updating a Key Result's current value automatically recalculates its completion percentage and rolls up progress to the parent Objective in under 100ms via client-side optimistic UI state.
- [ ] All delete and edit buttons across KPI cards and OKR lists appear strictly on mouse hover (`opacity-0 group-hover:opacity-100 focus:opacity-100`).
- [ ] All interactive action buttons (Save, Update Progress, Add Metric, Auto-Fill, Delete) display smooth spinning loader effects (`animate-spin`) while working, execute completely without triggering page reloads (`e.preventDefault()`, `type="button"`), and resolve well within a 5-second performance window.
- [ ] Strict brand adherence: UI palettes across the suite exclusively utilize curated brand indigo (`#6366f1` / `bg-indigo-500 hover:bg-indigo-600`) and sleek slate tones with **zero instances of blue anywhere**.
- [ ] Generating an `okr_kpi_performance_report` within the Document Library seamlessly pulls live KPI metrics and OKRs into structured tables and exports cleanly without syntax or type errors.
- [ ] All Supabase migration scripts enforce strict idempotency (`DROP POLICY IF EXISTS`, `CREATE TABLE IF NOT EXISTS`) to guarantee flawless automated deployment without error code `42710` conflicts.

---

## 5. Non-Functional & Security Requirements

| Requirement | Detail |
|---|---|
| **Multi-Tenant Security** | Every KPI, Objective, and Key Result must strictly enforce Supabase Row-Level Security (RLS) policies binding read/write operations to authenticated `organization_id` and project memberships. |
| **Performance SLA** | Interactive scorecards, slider adjustments, and custom section deletions must reflect instantaneously in DOM (<100ms optimistic state) and synchronize with Supabase backend under 500ms (strict <5s maximum tolerance). |
| **Brand Integrity** | Enforce zero occurrences of generic blue color styling across Tailwind classes; maintain cohesive glassmorphic dark mode and vibrant indigo/slate gradients. |
| **Architecture Cleanliness** | Maintain modular component architecture, extracting discrete UI subcomponents (`KpiScorecard.tsx`, `OkrObjectiveCard.tsx`, `KeyResultEditor.tsx`, `OkrDashboard.tsx`) into clean directories. |

---

## 6. Implementation Task Breakdown: Sprint 49

```
[Phase 1: Idempotent Schema & Server Actions] ──> [Phase 2: North Star & OKR Workspaces] ──> [Phase 3: Doc Engine Integration & Resolvers] ──> [Phase 4: Validation & Sign-Off]
```

### Phase 1: Idempotent Schema & RLS Foundation
- [ ] **Task 1.1:** Write and execute idempotent SQL migration script (`20260905000000_sprint49_okrs_kpis.sql`) creating `product_kpis`, `okr_objectives`, and `okr_key_results` tables with `JSONB` dynamic custom columns and strict RLS policies.
- [ ] **Task 1.2:** Define TypeScript interfaces in `src/lib/product-strategy/types.ts` and construct Server Actions with optimistic return handling in `src/lib/product-strategy/actions.ts`.

### Phase 2: North Star & OKR UI Workspaces
- [ ] **Task 2.1:** Build modular KPI components in `src/components/dashboard/product/okrs` (`KpiScorecard.tsx`, `KpiBuilderModal.tsx`, `NorthStarDashboard.tsx`).
- [ ] **Task 2.2:** Build hierarchical OKR tracking components (`OkrObjectiveCard.tsx`, `KeyResultRow.tsx`, `OkrBuilderModal.tsx`) incorporating inline progress updates, confidence scoring toggles, hover-activated actions, and spinning loader animations.

### Phase 3: Document Engine Integration & Resolvers
- [ ] **Task 3.1:** Register `okr_kpi_performance_report` template inside the Document Engine's dynamic registry (`src/lib/documents/actions.ts`).
- [ ] **Task 3.2:** Implement automated data-binding resolver and frontend hook (`useOkrKpiReportData.ts`) to inject active KPIs, Objectives, progress percentages, and risk status directly into draft documents.
- [ ] **Task 3.3:** Verify dynamic custom section text fields and extra table column addition operate seamlessly inside OKR & KPI Performance Reports without page reloading.

### Phase 4: Validation & Quality Assurance
- [ ] **Task 4.1:** Conduct compiler and type safety validation (`npx tsc --noEmit`) to verify zero TypeScript errors or broken imports across the Product Strategy Suite.
- [ ] **Task 4.2:** Test responsive UX layouts across desktop, tablet, and mobile viewports, verifying hover opacity transitions and spinning loading states during simulated background operations.

---

## 7. Sprint Delivery Milestones

**Milestone 1 — Idempotent Data Architecture Complete** *(Target: Day 2)*
Database migration executed cleanly without RLS errors; TypeScript types and CRUD server actions verified and functional.

**Milestone 2 — Quantitative Workspaces Functional & Fast** *(Target: Day 5)*
North Star KPI dashboards and interactive OKR tracking trees live; inline progress updates execute instantaneously without page reloads; hover-only edit/delete buttons fully configured with spinning loader animations.

**Milestone 3 — Document Library auto-filling & Export Ready** *(Target: Day 7)*
`okr_kpi_performance_report` document type generates automatically inside the Document Engine, populating rich Markdown tables with live OKR data and supporting instant custom section fields.

**Milestone 4 — Final Verification & Release Sign-Off** *(Target: Day 8)*
Zero TypeScript errors confirmed via terminal compilation; adherence to brand styling (zero blue) validated; end-to-end performance and reactivity SLAs met.

---

## 8. Open Questions & Recommendations Carried Into This Sprint

- **Confidence Score Calculation:** Should Key Result confidence scores be set manually by the Product Manager (e.g., slider from 0% to 100%), or mathematically derived from linear progression over elapsed sprint time?
  - *Recommendation:* Provide manual slider adjustment as primary input to capture qualitative reality, with an automated fallback trend hint if actual progress lags significantly behind elapsed quarterly timeline.
- **Cross-Template References:** Should OKR Objectives link directly to existing Project Milestones (WBS elements) in addition to Sprint 48 Product Strategy Pillars?
  - *Recommendation:* Add an optional `wbs_element_id` nullable foreign key to `okr_objectives` in Phase 1 to support seamless downstream alignment between discovery strategy and traditional Gantt execution schedules.

---

## Development & Brand Guidelines
- **Zero Page Reloading:** Explicitly attach `e.preventDefault()`, `e.stopPropagation()`, and `type="button"` to all interactive buttons and forms; utilize React local state optimistic updates for frictionless UX.
- **Hover Visibility:** Configure all destructive and structural edit actions (delete, modify, remove attribute) with `opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity` inside parent `group` elements.
- **Spinning Loaders:** Equip all action controls with lucide-react spinning indicators (`<Loader2 className="animate-spin" />` or `<RefreshCw className="animate-spin" />`) during background state synchronization.
- **Brand Indigo Styling:** Exclusively employ brand indigo (`#6366f1` / `bg-indigo-500 hover:bg-indigo-600`) and slate palettes for all UI components. **Never introduce any instances of blue.**
- **Idempotency & Resilience:** Structure all database SQL queries with robust idempotency guards to prevent table or policy re-creation errors.

---

*End of Sprint 49 PRD. This sprint implements the quantitative measurement engine for the Product Management Suite (Phase 14) — bridging upstream strategic ambition directly into measurable North Star KPIs, dynamic OKRs, and formal enterprise documentation.*
