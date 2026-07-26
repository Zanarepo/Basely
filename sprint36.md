# Product Requirements Document (PRD)
# Sprint 36: Document Library — Fast-Follow: Stakeholder & Risk Register Documents

---

## 1. Objective & Scope

The objective of Sprint 36 is to finish two document exports that were explicitly promised to Documentation Engine by earlier phases but never actually built: the **Stakeholder Register document** and the **Risk Register document**. This is the cheapest sprint in the entire document-library completion effort — no new data model, just two new template definitions on Documentation Engine's existing Sprint 12 engine.

By the end of this sprint, a Project Manager will be able to:
- Generate a formatted Stakeholder Register document from live Sprint 9 data
- Generate a formatted Risk Register document from live Sprint 11 data
- Export both in every format already supported by Documentation Engine (PDF, Word, and Excel for these two tabular types)

**Out of scope for this sprint:** any change to the underlying stakeholder or risk data models — this sprint is presentation-layer only, exactly like every other Documentation Engine document.

> **Hard dependency:** This sprint requires Documentation Engine's Sprint 12 templating engine, Accountability Layer's Sprint 9 (stakeholder data) and Sprint 11 (risk data), and Sprint 15's multi-format export infrastructure — all of which already exist and require zero modification.

---

## 2. User Stories

- **As a Project Manager**, I want a formatted Stakeholder Register document, so that I can share who's involved in my project with people who don't have platform access.
- **As a Project Manager**, I want a formatted Risk Register document, so that I can share my project's risk picture in a client-ready format without manually recreating it in a spreadsheet.

---

## 3. Functional Requirements

### 3.1 Stakeholder Register Document
- Fully data-bound export of Sprint 9's stakeholder register: name, role/title, organization type, influence, interest, communication preference.
- Structured as a readable roster (grouped or sorted sensibly — e.g., internal vs. external), not a raw table dump.
- `is_snapshot = false` — always reflects current live data, consistent with the Charter/WBS Dictionary/RACI pattern, not the frozen Status Report pattern.

### 3.2 Risk Register Document
- Fully data-bound export of Sprint 11's risk register: title, probability, impact, score, response strategy, status, owner.
- Sorted by risk score descending, consistent with the in-app prioritized risk view — the document should never present risks in a different order than what the platform itself considers "priority."
- `is_snapshot = false`, same reasoning as above.

### 3.3 Reuse Requirement
- Both documents must be added as new `document_type` values using Documentation Engine's existing `DocumentTemplate`/`GeneratedDocument` schema — this sprint should require zero changes to Sprint 12's core templating engine or Sprint 15's export pipeline.

---

## 4. Acceptance Criteria

- Both documents generate correctly and reflect live data with zero staleness — verified by changing underlying stakeholder/risk data and confirming the document reflects it without any manual regeneration step beyond what Sprint 12 already requires.
- Both are available in every export format Sprint 15 supports for tabular documents (PDF, Word, Excel).
- No modification to Sprint 12's core engine code was required — confirmed via code review, as evidence the reuse claim in Section 3.3 actually held.

---

## 5. Non-Functional & Security Requirements

| Requirement | Detail |
|---|---|
| **Consistency** | Must use the identical rendering pipeline as Sprint 13's WBS Dictionary/RACI documents — this is a template-definition task, not an engineering task. |
| **Data Isolation** | Inherits the same project-scoped RLS pattern as every other Documentation Engine document. |
| **Correctness** | Risk sort order in the document must always exactly match the in-app prioritized view's sort order — any divergence undermines trust in both. |

---

## 6. Implementation Task Breakdown: Sprint 36

```
[Phase 1: Template Definitions] ──> [Phase 2: Stakeholder Register Resolver] ──> [Phase 3: Risk Register Resolver] ──> [Phase 4: Export Validation]
```

### Phase 1: Template Definitions
- [ ] **Task 1.1:** Define `document_type = 'stakeholder_register'` and `'risk_register'` templates using Sprint 12's existing `DocumentTemplate` schema.

### Phase 2: Stakeholder Register Resolver
- [ ] **Task 2.1:** Build the data resolver pulling all Sprint 9 stakeholder fields, grouped/sorted for readability.

### Phase 3: Risk Register Resolver
- [ ] **Task 3.1:** Build the data resolver pulling all Sprint 11 risk fields, reusing the exact sort-by-score logic from the in-app prioritized view (not a re-derived copy).

### Phase 4: Export Validation
- [ ] **Task 4.1:** Confirm both new document types export correctly to PDF, Word, and Excel via Sprint 15's existing pipeline, with no pipeline modifications needed.

---

## 7. Sprint Delivery Milestones

**Milestone 1 — Templates Defined** *(Target: Day 1)*
Both document type templates created, validated against Sprint 12's schema with zero modifications required.

**Milestone 2 — Resolvers Working** *(Target: Day 3)*
Both documents render correctly with live data matching their in-app source views exactly.

**Milestone 3 — Export & Sprint Sign-Off** *(Target: Day 4)*
Both documents export correctly across all supported formats; all Section 4 acceptance criteria pass.

---

## 8. Open Questions Carried Into This Sprint

- **Grouping in the Stakeholder Register document:** should stakeholders be grouped by organization type (internal/external), by influence/interest quadrant, or listed flat sorted by name? Recommend grouping by internal/external as the simplest, most broadly useful default.
- **Historical process gap:** should there be a lightweight, recurring check (e.g., at the end of every future phase) confirming that any document explicitly "deferred to Documentation Engine" in one phase's PRD actually gets built before that phase is considered fully closed? This sprint exists because that check didn't happen the first time — worth formalizing as a process, not just fixing the one instance.

---

*End of Sprint 36 PRD. This is the cheapest sprint in the entire Phase 12 effort — deliberately sequenced first so already-owed work gets finished before any new scope begins.*