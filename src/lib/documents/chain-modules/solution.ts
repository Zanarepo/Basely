'use server'
import { chainDocumentGeneration } from './core';

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { getSyncDocumentTemplate } from '../prd-templates'
import { STATIC_TEMPLATES } from '../static-templates'
import { revalidatePath } from 'next/cache'
import { upsertStrategyCanvasFromAI } from '@/lib/product-strategy/strategy-actions'


/**
 * 4. Synthesize PRD from Roadmap — All 23 sections
 */
export async function synthesizePrdFromRoadmap(
  projectId: string,
  roadmapContent: Record<string, string>
): Promise<{ ok: boolean; prdDocId?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    const rawRoadmapText = Object.entries(roadmapContent)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[Section: ${k}]\n${v}`)
      .join('\n\n')

    const systemPrompt = `You are Praz-AI, a Senior Technical Product Manager. You will receive a Product Roadmap.
Synthesize this Roadmap into a comprehensive 23-section Product Requirements Document (PRD).
Format your output as a JSON object with the following exact keys. Each value must be a rich markdown string with detailed content:
{
  "executive_summary": "### 1.1 Feature Overview\\n[Detailed overview]\\n\\n### 1.2 Problem Statement\\n> [Problem narrative]\\n\\n### 1.3 Opportunity\\n[Business impact]",
  "goals_objectives": "### 2.1 Feature Goals\\n1. [Goal 1]\\n2. [Goal 2]\\n\\n### 2.2 Success Criteria\\n- [ ] [Criterion]\\n\\n### 2.3 Non-Goals\\n- [Non-goal]",
  "user_personas": "### Primary Persona: [Role]\\n- **Needs:** ...\\n- **Pain Points:** ...\\n\\n### Secondary Persona: [Role]\\n- **Needs:** ...",
  "user_stories": "### US-01 — [Story]\\n**As a** [user] **I want to** [action] **So that** [benefit]\\n\\n### US-02 — [Story]\\n**As a** [user] **I want to** [action] **So that** [benefit]",
  "functional_requirements": "### FR-01: [Requirement]\\n**Description:** [Details]\\n- The system shall...\\n\\n### FR-02: [Requirement]\\n- The system shall...",
  "user_flow": "### Primary Flow\\n1. [Step]\\n\\n### Alternative Flow\\n1. [Step]\\n\\n### Error Flow\\n1. [Step]",
  "ui_ux_requirements": "### Screens Required\\n- [Screen 1]\\n- [Loading State]\\n- [Error State]\\n\\n### Design Guidelines\\n- [Guidelines]",
  "business_rules": "| ID | Business Rule |\\n|---|---|\\n| BR-01 | [Rule] |\\n| BR-02 | [Rule] |",
  "data_requirements": "### Inputs & Validation\\n| Field | Type | Required | Rule |\\n|---|---|---|---|\\n\\n### Output & Data Changes\\n- [Changes]",
  "permissions_access_control": "| User Role | View | Create | Edit | Delete | Approve |\\n|---|:---:|:---:|:---:|:---:|:---:|\\n| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |",
  "notifications_channels": "### Triggers\\n- [Event]\\n\\n### Channels\\n- In-app / Email / Push",
  "non_functional_requirements": "### Performance\\n- Load < 2s\\n\\n### Security\\n- [Requirements]\\n\\n### Accessibility\\n- WCAG AA",
  "analytics_tracking": "### Events\\n| Event | Trigger | Properties |\\n|---|---|---|\\n\\n### Key Metrics\\n- [Metrics]",
  "acceptance_criteria": "### AC-01\\n**Given** [condition] **When** [action] **Then** [result]\\n\\n### AC-02\\n**Given** [condition] **When** [action] **Then** [result]",
  "edge_cases": "The system must handle:\\n- Duplicate submissions\\n- Network issues\\n- Empty states\\n- Concurrent updates",
  "technical_considerations": "### Frontend\\n- [Approach]\\n\\n### Backend\\n- [Approach]\\n\\n### Infrastructure\\n- [Dependencies]",
  "qa_testing_requirements": "### Testing Suites\\n- [ ] Unit\\n- [ ] Integration\\n- [ ] E2E\\n\\n### UAT Criteria\\n- [Criteria]",
  "sprint_scope": "### In Scope\\n- [Items]\\n\\n### Out of Scope\\n- [Items]\\n\\n### Checklist\\n- [ ] UI done\\n- [ ] Backend done\\n- [ ] Tests pass",
  "dependencies_risks": "| Type | Description | Impact | Mitigation | Owner |\\n|---|---|---|---|---|\\n| [Type] | [Details] | [Impact] | [Plan] | [Owner] |",
  "definition_of_done": "Done when:\\n- [ ] All AC pass\\n- [ ] Code reviewed\\n- [ ] Tests pass\\n- [ ] QA approved\\n- [ ] Deployed",
  "open_questions": "| # | Question | Owner | Due | Status |\\n|---|---|---|---|---|\\n| 1 | [Question] | [Owner] | [Date] | Open |",
  "decisions_log": "| Date | Decision | Rationale | Decided By |\\n|---|---|---|---|\\n| [Date] | [Decision] | [Why] | [Owner] |",
  "related_documents_approvals": "### Approval Matrix\\n| Role | Name | Status | Date |\\n|---|---|---|---|\\n| PM | [Name] | Pending | |\\n\\n### Related Docs\\n- Strategy, Roadmap, Research"
}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.
CRITICAL FOR VERIFIABLE DATA: Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. For sections involving data, sizing, and trends, you should only state facts that you can verify from your training data. When stating such facts, provide a direct citation to the source (e.g., "[Title of Source](https://real-url.com/page)" if you know the exact URL from your training data). If you cannot verify a specific fact from your training data, qualify the statement appropriately rather than inventing a source. Never output raw numbers or statistics without a verifiable source citation.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawRoadmapText || 'Product Roadmap Summary.',
    })

    // Map to standard_prd keys for backward compatibility
    const standardPrdMappings: Record<string, string> = {
      prd_objective: parsedResult.executive_summary || '',
      prd_scope_in: parsedResult.sprint_scope || '',
      prd_scope_out: parsedResult.goals_objectives || '',
      prd_acceptance_criteria: parsedResult.acceptance_criteria || '',
      prd_telemetry: parsedResult.analytics_tracking || '',
      prd_wireframes: parsedResult.ui_ux_requirements || '',
    }

    const prdVariant = 'enterprise_full_prd'
    const syncTpl = getSyncDocumentTemplate('product_requirements_document', prdVariant)

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
      ...standardPrdMappings,
      __prd_template_variant: prdVariant,
      __section_order: JSON.stringify(syncTpl.section_definitions.map((s: any) => s.key)),
    }

    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'product_requirements_document')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (existing) {
      const mergedFreeText = {
        ...(existing.free_text_content as Record<string, string> || {}),
        ...freeTextPayload,
      }
      const { error } = await adminSupabase
        .from('generated_documents')
        .update({
          free_text_content: mergedFreeText,
          updated_at: now,
        })
        .eq('id', existing.id)

      if (error) return { ok: false, error: error.message }
      return { ok: true, prdDocId: existing.id }
    } else {
      const { data: inserted, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: 'product_requirements_document',
          custom_template_id: null,
          free_text_content: freeTextPayload,
          created_at: now,
          updated_at: now,
          is_snapshot: false,
        })
        .select('id')
        .single()

      if (error) return { ok: false, error: error.message }
      return { ok: true, prdDocId: inserted.id }
    }
  } catch (err: any) {
    console.error('[synthesizePrdFromRoadmap Error]:', err)
    return { ok: false, error: err.message || 'Failed to synthesize PRD' }
  }
}

export async function draftSolutionDesignFromRoadmap(projectId: string, templateId?: string, itemId?: string) {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch items from product_backlog_items table (The Roadmap Kanban Board) with OKR associations
    const { data: allBacklogItems, error: fetchErr } = await adminSupabase
      .from('product_backlog_items')
      .select(`
        id, 
        title, 
        description, 
        rice_score, 
        moscow_status, 
        horizon, 
        theme, 
        primary_okr_id,
        okr:primary_okr_id(title)
      `)
      .eq('project_id', projectId)
      .order('rice_score', { ascending: false })

    if (fetchErr) {
      console.error('[draftSolutionDesignFromRoadmap Error fetching backlog]:', fetchErr)
    }

    let nowBacklogItems = []
    
    if (itemId) {
      // If a specific itemId is provided, generate SD ONLY for that item regardless of horizon
      nowBacklogItems = (allBacklogItems || []).filter(item => item.id === itemId)
    } else {
      // Filter strictly for items assigned to 'NOW' in the Kanban board
      nowBacklogItems = (allBacklogItems || []).filter(
        item => item.horizon && (
          item.horizon.trim().toLowerCase() === 'now' ||
          item.horizon.trim().toLowerCase().includes('now')
        )
      )
    }

    // ── DEBUG: Log ALL backlog items and which ones matched NOW ──
    console.log('[draftSolutionDesign] Total backlog items fetched:', (allBacklogItems || []).length)
    console.log('[draftSolutionDesign] All items horizons:', (allBacklogItems || []).map((i: any) => ({
      title: i.title?.substring(0, 60),
      horizon: i.horizon,
    })))
    console.log('[draftSolutionDesign] NOW items count:', nowBacklogItems.length)
    console.log('[draftSolutionDesign] NOW items:', nowBacklogItems.map((i: any) => ({
      id: i.id,
      title: i.title,
      horizon: i.horizon,
      moscow: i.moscow_status,
      theme: i.theme,
      okr: i.okr?.title,
    })))

    // 2. Fetch Roadmap documents ONLY as a fallback if no Kanban items exist
    let nowDocText = ''
    if (!nowBacklogItems || nowBacklogItems.length === 0) {
      const { data: roadmapDocs } = await adminSupabase
        .from('generated_documents')
        .select('free_text_content, document_type')
        .eq('project_id', projectId)
        .in('document_type', ['roadmap_workspace', 'product_roadmap_document', 'product_roadmap'])
        .eq('is_snapshot', false)

      if (roadmapDocs && roadmapDocs.length > 0) {
        for (const doc of roadmapDocs) {
          const ft = (doc.free_text_content as Record<string, string>) || {}
          if (ft.now_horizon) {
            const text = ft.now_horizon.trim()
            const isPlaceholder = text.includes('[Initiative 1]') && text.includes('[Initiative 2]') && text.length < 160
            if (text.length > 15 && !isPlaceholder) {
              nowDocText += `\n[ROADMAP DOCUMENT NOW HORIZON (${doc.document_type})]:\n${text}\n`
            }
          }
        }
      }
    }

    const hasNowBacklog = nowBacklogItems && nowBacklogItems.length > 0
    const hasNowDoc = nowDocText.trim().length > 0

    // Strict Gating: If both the Kanban NOW column and Roadmap NOW section have no items
    if (!hasNowBacklog && !hasNowDoc) {
      return {
        ok: false,
        error: "No items found in the 'NOW' column of your Roadmap Kanban board. Please drag and drop prioritized cards from the Backlog into the 'Now' column before generating Solution Design."
      }
    }

    // 3. Format focused NOW context strictly targeting the committed initiatives
    let rawNowContext = `[TARGET COMMITTED ROADMAP INITIATIVES IN "NOW" HORIZON]\n\n`
    if (hasNowBacklog) {
      rawNowContext += `Total Committed NOW Initiatives: ${nowBacklogItems.length}\n\n`
      nowBacklogItems.forEach((item: any, idx: number) => {
        const okrTitle = item.okr?.title ? `\n- Strategic Goal / OKR: ${item.okr.title}` : ''
        rawNowContext += `### Initiative ${idx + 1}: ${item.title}\n`
        rawNowContext += `- MoSCoW Priority: ${item.moscow_status || 'Must'}\n`
        rawNowContext += `- RICE Score: ${item.rice_score ?? 'N/A'}\n`
        rawNowContext += `- Strategic Theme: ${item.theme || 'Core Experience'}${okrTitle}\n`
        if (item.description) rawNowContext += `- Description: ${item.description}\n`
        rawNowContext += `\n`
      })
    } else if (hasNowDoc) {
      rawNowContext += `\n${nowDocText}\n`
    }

    // ── DEBUG: Log the exact context being sent to the AI ──
    console.log('[draftSolutionDesign] hasNowBacklog:', hasNowBacklog, '| hasNowDoc:', hasNowDoc)
    console.log('[draftSolutionDesign] rawNowContext being sent to AI:\n', rawNowContext)

    // 4. Construct JSON Schema from Solution Design Template
    const targetDocumentType = 'solution_design_workspace'
    const { data: targetDoc, error: queryError } = await adminSupabase
      .from('generated_documents')
      .select('id, custom_template_id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', targetDocumentType)
      .eq('is_snapshot', false)
      .maybeSingle()
      
    if (queryError) {
      console.error('[draftSolutionDesignFromRoadmap] Query Error:', queryError)
      return { ok: false, error: 'Database query failed: ' + queryError.message }
    }

    let sectionDefs: any[] = []
    let template: any = STATIC_TEMPLATES[targetDocumentType]
    if (!template) {
      template = getSyncDocumentTemplate(targetDocumentType, templateId || targetDoc?.custom_template_id || undefined)
    }
    
    if (template?.section_definitions) {
      sectionDefs = template.section_definitions
    }

    const freeTextSections = sectionDefs.filter((s: any) => s.type !== 'data_bound')
    if (!freeTextSections || freeTextSections.length === 0) {
      return { ok: false, error: 'No free-text sections found in template for solution_design_workspace.' }
    }

    let schemaObj: Record<string, string> = {}
    for (const section of freeTextSections) {
      let desc = `Markdown string for: ${section.title}`
      if (section.placeholder) {
        desc += `. Format exactly like this placeholder structure: ${section.placeholder.replace(/\n/g, ' ')}`
      }
      schemaObj[section.key] = desc
    }
    const schemaString = JSON.stringify(schemaObj, null, 2)

    // 5. Senior Product Designer Prompt strictly focused on the specific NOW features
    const targetFeaturesList = hasNowBacklog
      ? nowBacklogItems.map((i: any) => `"${i.title}"`).join(', ')
      : 'the committed NOW roadmap initiatives'

    // ── DEBUG: Log final target features ──
    console.log('[draftSolutionDesign] targetFeaturesList:', targetFeaturesList)

    const systemPrompt = `You are Praz-AI, a World-Class Principal Product Designer, UX Architect, and Design Thinking Lead.
Your goal is to generate a comprehensive, deep, and cohesive Solution Design & Wireframe specification centered EXCLUSIVELY on the committed NOW roadmap initiative(s): ${targetFeaturesList}.

CRITICAL DOMAIN & FEATURE ALIGNMENT REQUIREMENTS:
- Every single section (Opportunity Context, Problem Reframing, Desired Outcomes, Solution Principles, Solution Hypotheses, Solution Exploration, Ideation, Solution Alternatives, Concept Development, User Flows, Experience Design, Wireframes, Technical Architecture, MVP Definition, Success Metrics) MUST directly, specifically, and exclusively address ${targetFeaturesList}.
- Under "6. Solution Exploration" and "8. Solution Alternatives", evaluate genuine UX, architectural, and delivery options tailored to ${targetFeaturesList} (e.g. for Training & Change Enablement, explore LMS vs In-App Interactive Guided Walkthroughs vs Embedded Simulation Sandboxes). Do NOT discuss unrelated topics (such as ETL or data migration) that do not match the committed feature.
- Provide step-by-step user journey maps, concrete UI wireframe layouts, visual hierarchy, interaction states, and actionable experiment test plans specifically tailored to this feature.
- Use rich, heavily structured Markdown formatting. Use extensive bullet points, H2/H3 headers, bolding for emphasis, tables where useful, and code blocks for architecture or UI wireframe sketches. Ensure the document feels highly structured and visually appealing. Do not output walls of unstructured text.

CRITICAL CITATION & EVIDENCE REQUIREMENT:
For EVERY section you generate that includes claims, statistics, market data, competitor information, methodologies, or factual statements, you MUST provide verifiable citations within the markdown text.
Because you do not have live web access, DO NOT hallucinate or guess direct URLs for sources. Instead, you MUST generate valid Google Search URLs that the user can click to instantly verify your claim. Format: [Search Term](https://www.google.com/search?q=search+term+here).
Example format: "The market is expected to reach $100B by 2025 ([Verify on Google](https://www.google.com/search?q=global+market+report+2025+size))."

Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
${schemaString}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawNowContext,
    })

    // 6. FULL OVERWRITE (do NOT merge with stale existing content)
    // Previous merging caused old ETL content to persist across regenerations.
    const mergedPayload: Record<string, string> = {
      ...parsedResult,
    }

    const now = new Date().toISOString()
    if (targetDoc?.id) {
      const { error: updateError } = await adminSupabase
        .from('generated_documents')
        .update({ free_text_content: mergedPayload, updated_at: now, generated_at: now })
        .eq('id', targetDoc.id)
      if (updateError) {
        console.error('[draftSolutionDesignFromRoadmap] Update Error:', updateError)
        return { ok: false, error: 'Database update failed: ' + updateError.message }
      }
    } else {
      const { error: insertError } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: targetDocumentType,
          custom_template_id: templateId || targetDoc?.custom_template_id || null,
          free_text_content: mergedPayload,
          is_snapshot: false,
          created_at: now,
          updated_at: now,
          generated_at: now,
        })
      if (insertError) {
        console.error('[draftSolutionDesignFromRoadmap] Insert Error:', insertError)
        return { ok: false, error: 'Database insert failed: ' + insertError.message }
      }
    }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { ok: true, data: mergedPayload }

  } catch (err: any) {
    console.error('[draftSolutionDesignFromRoadmap Error]:', err)
    return { ok: false, error: err.message || 'Failed to generate Solution Design' }
  }
}

// Backward compatibility alias
export const draftSolutionDesignFromPrioritization = draftSolutionDesignFromRoadmap

export async function draftValidationFromSolutionDesign(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'solution_validation_workspace', 
    'solution_design_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Solution Design into an Experimentation & Validation plan.',
    templateId
  )
}

export async function draftPrdFromValidation(projectId: string, templateId?: string) {
  return chainDocumentGeneration(
    projectId, 
    'product_requirements_document', 
    'solution_validation_workspace',
    'Technical Product Manager',
    'Synthesize the upstream Validation plan and success metrics into a comprehensive Product Requirements Document (PRD).',
    templateId
  )
}

// ==========================================
// PRIORITIZATION WORKSPACE: AI RICE Item Generator
// ==========================================