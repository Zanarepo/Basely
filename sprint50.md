# Product Requirements Document (PRD)
# Sprint 50: Product Management Suite — Voice-of-Customer Discovery Log & Interactive PRD Studio (Phase 14 Sprint 3)

---

## 1. Objective & Scope

The objective of Sprint 50 (Sprint 3 of the Phase 14 Product Management Suite) is to establish the **Voice-of-Customer (VoC) Discovery Log** and an interactive **Product Requirements Document (PRD) Studio**. This phase bridges the gap between upstream strategic planning (Personas & OKRs from Sprints 48/49) and downstream engineering execution by allowing PMs to systematically process customer feedback, cluster insights, and draft modular technical specifications.

Building directly upon the foundational Personas and OKR frameworks, this sprint provides Product Managers with a structured inbox to track user feedback (Discovery Insights) and a dedicated studio to author PRDs that formally link to the strategic entities they aim to influence.

By the end of this sprint, a Product Manager will be able to:
- Log and triage **Discovery Insights** (user feedback, support tickets, interview notes) tagged by severity, frequency, and linked Persona IDs.
- Author interactive **Product Requirements Documents (PRDs)** that modularly capture Objectives, In/Out of Scope, Telemetry requirements, and embedded Figma/UX wireframes.
- Dynamically add sections and fields to PRDs without page reloads, ensuring a smooth authoring experience.
- Convert Discovery Insights directly into Change Request Log entries or attach them as supporting context to Risk Registers.

**Out of scope for this sprint:** automated ingestion of feedback from external CRMs (e.g., Salesforce, Zendesk) or mathematical RICE/MoSCoW feature prioritization scoring (scheduled for Sprint 51). This sprint strictly focuses on establishing the manual discovery triage engine and the PRD authoring studio.

> **Hard dependency:** This sprint requires Sprint 48 (Personas) and Sprint 49 (OKRs), Back Office Sprint 29 (multi-tenancy workspace isolation), Documentation Engine Sprint 12 & 38 (templating and document registry), and Governance Sprint 22 (RLS and audit logging).

---

## 2. User Stories

- **As a Product Manager**, I want to log raw customer feedback and discovery insights in a centralized triage inbox, so that I can categorize pain points by frequency and severity.
- **As a Product Manager**, I want to link specific Voice-of-Customer insights to my established Personas, so that I can ensure we are solving problems for our primary target market.
- **As a Product Manager**, I want to author structured Product Requirements Documents (PRDs) containing modular sections (Objective, Scope, Wireframes), so that engineering teams receive clear, standardized specifications.
- **As a Product Manager**, I want to link my PRDs directly to the OKRs and North Star metrics they intend to move, so that strategic alignment is explicitly documented.
- **As a PMO Director**, I want Discovery Insights to bidirectionally link to Change Request Logs and Risk Registers, so that customer feedback can formally trigger project governance workflows.

---

## 3. Technical Architecture & Database Design

### 3.1. Schema Expansions (PostgreSQL)
Two primary tables and required junction tables will be introduced into the `public` schema with Row Level Security (RLS) tied to the `organization_id`.

**Table: `discovery_insights`**
- `id`: UUID (Primary Key)
- `organization_id`: UUID (FK to organizations)
- `project_id`: UUID (FK to projects)
- `title`: TEXT
- `description`: TEXT
- `source`: TEXT (e.g., 'Customer Interview', 'Support Ticket', 'Sales Call')
- `severity`: TEXT ('low', 'medium', 'high', 'critical')
- `frequency`: INTEGER (tracking how often this comes up)
- `persona_id`: UUID (FK to personas table from Sprint 48)
- `status`: TEXT ('new', 'triaged', 'converted', 'archived')
- `metadata`: JSONB (For dynamic extra fields)
- `created_by`: UUID (FK to profiles)
- `created_at`, `updated_at`: TIMESTAMP

**Table: `product_requirements_docs` (Metadata extension)**
*Note: The actual document payload leverages the existing `documents` table from the Documentation Engine (Sprint 38). This table holds the structured relational data for the PRD Studio.*
- `id`: UUID (Primary Key)
- `document_id`: UUID (FK to documents table)
- `organization_id`: UUID (FK to organizations)
- `project_id`: UUID (FK to projects)
- `primary_okr_id`: UUID (FK to okr_objectives from Sprint 49)
- `target_persona_id`: UUID (FK to personas from Sprint 48)
- `figma_url`: TEXT (Optional embed link)
- `telemetry_requirements`: JSONB
- `created_at`, `updated_at`: TIMESTAMP

---

## 4. UI/UX & Component Design

### 4.1. VoC Discovery Inbox (`DiscoveryInbox.tsx`)
- **Layout**: A split-pane or Kanban-style triage board. Left pane contains raw incoming feedback; right pane allows clustering and tagging.
- **Functionality**: Dropdowns to assign Personas and severity. A 1-click action to "Convert to Change Request" or "Attach to Risk".

### 4.2. PRD Studio Workspace (`PrdStudioWorkspace.tsx`)
- **Layout**: A clean, white-background (`bg-white dark:bg-slate-900 border border-slate-200`) structured authoring environment. 
- **Modularity**: Inline "Add Section" buttons allowing PMs to dynamically inject 'In Scope', 'Out of Scope', 'Acceptance Criteria', and 'Telemetry' blocks without reloading.
- **Strategic Linking**: A prominent right-hand sidebar or top metadata ribbon to select the Target Persona and the Primary OKR this PRD drives.

### 4.3. Figma Integration
- A lightweight React component (`FigmaEmbed.tsx`) that accepts a valid Figma URL and renders the live interactive iframe securely within the PRD.

---

## 5. Document Library Integration

### 5.1. Registry Extension
- Register `product_requirements_document` as a native `document_type` within the existing Document Library registry.
- Establish the `PrdDocumentResolver.tsx` which fetches the metadata (OKRs, Personas, Figma links) and compiles it alongside the standard rich-text document blocks.

### 5.2. Exports and Snapshots
- Ensure the PRD inherits the standard PDF export functionality. Figma iframes should gracefully degrade to a static placeholder or link in PDF exports.

---

## 6. Implementation Task Breakdown: Sprint 50

### Phase 1: Schema & Data Access (Backend)
- [ ] **Task 1.1:** Create `discovery_insights` table with Persona FKs, indexes, and RLS policies.
- [ ] **Task 1.2:** Create `product_requirements_docs` metadata table linking to OKRs and Personas.
- [ ] **Task 1.3:** Build Supabase server-side actions (`getDiscoveryInsights`, `createDiscoveryInsight`, `updatePrdMetadata`).

### Phase 2: VoC Discovery Inbox (UI)
- [ ] **Task 2.1:** Build `DiscoveryInbox.tsx` with clean, fast-loading list/kanban views.
- [ ] **Task 2.2:** Implement inline editing for severity, frequency, and Persona assignment.
- [ ] **Task 2.3:** Wire the "Convert to Change Request" bridge action reusing Sprint 41 logic.

### Phase 3: PRD Studio & Document Engine (UI)
- [ ] **Task 3.1:** Register `product_requirements_document` in the Document Engine.
- [ ] **Task 3.2:** Build `PrdStudioWorkspace.tsx` with dynamic section additions (ensuring no page reloads, <5s loaders on save actions).
- [ ] **Task 3.3:** Build `FigmaEmbed.tsx` for visual design integration.
- [ ] **Task 3.4:** Create `PrdDocumentResolver.tsx` to format the PRD for formal viewing and PDF export.

*End of Sprint 50 PRD. This sprint establishes the tactical discovery and authoring layer for the Product Management Suite (Phase 14) — connecting strategic OKRs and Personas directly into actionable product specifications and customer insights.*
