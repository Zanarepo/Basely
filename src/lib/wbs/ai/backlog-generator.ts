'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { logGovernanceEvent } from '@/lib/governance/actions'
import { revalidatePath } from 'next/cache'

import type { GeneratedEpic, GeneratedWP } from './wbs-generator'

export async function generateBacklogFromPrdAndRoadmap(
  projectId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()

    // 1. Fetch PRD
    const { data: prdDoc, error: prdError } = await adminClient
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'product_requirements_document')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (prdError || !prdDoc || !prdDoc.free_text_content) {
      return { success: false, error: 'Product Requirements Document is missing. Please generate it first.' }
    }

    const prdText = Object.entries(prdDoc.free_text_content as Record<string, string>)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.toUpperCase()}]\n${v}`)
      .join('\n\n')

    // Fetch Roadmap (optional, for timeline context)
    const { data: roadmapDoc } = await adminClient
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'product_roadmap_document')
      .eq('is_snapshot', false)
      .maybeSingle()

    let roadmapText = ''
    if (roadmapDoc && roadmapDoc.free_text_content) {
      roadmapText = Object.entries(roadmapDoc.free_text_content as Record<string, string>)
        .filter(([k]) => !k.startsWith('__'))
        .map(([k, v]) => `[${k.toUpperCase()}]\n${v}`)
        .join('\n\n')
    }

    // 2. Build AI Prompt (Agile style)
    const systemPrompt = `You are Praz-AI, a Senior Agile Product Owner. Your ONLY job is to extract a true Agile Product Backlog — Epics and User Stories — VERBATIM from the provided PRD.

STRICT AGILE EXTRACTION RULES:
1. EPICS: Each major feature or capability defined in the PRD becomes one Epic. Extract the exact feature name (e.g. "Role-Based In-App Enablement Engine (R-IAEE)").
2. USER STORIES: The work_packages are the EXACT User Stories listed in the PRD (US-01, US-02, etc.). Use the FULL "As a [persona] I want to [action] So that [outcome]" wording from the PRD. Do NOT paraphrase or rename.
3. ACCEPTANCE CRITERIA: Copy the EXACT Acceptance Criteria (AC-01, AC-02, etc.) from the PRD into the acceptance_criteria array for the relevant user story.
4. EDGE CASES: Extract edge cases and failure scenarios from the PRD's QA/Testing section.
5. STORY POINTS: Estimate story_points (1, 2, 3, 5, 8, 13, 21) using Fibonacci scale based on complexity — do NOT use days.
6. DO NOT invent tasks. DO NOT generate waterfall phases like "Requirements Gathering", "UAT", "Cutover". Only extract what is explicitly in the PRD.
7. predecessor_dependencies: define sequencing between user stories (US-01 before US-02, etc.)

Output ONLY strictly valid JSON with this exact structure:

{
  "epics": [
    {
      "epic_title": "string — exact feature name from PRD",
      "epic_description": "string — feature overview from PRD executive_summary or prd_objective",
      "epic_tangible_deliverables": ["string — key deliverable per the PRD"],
      "epic_acceptance_criteria": ["string — high-level AC from PRD"],
      "epic_user_stories": ["string — brief summary of each US under this epic"],
      "epic_edge_cases": ["string — edge cases from PRD QA section"],
      "epic_priority": "Critical | High | Medium | Low",
      "work_packages": [
        {
          "id_key": "us_01_unique",
          "title": "US-01 — [Story title from PRD]",
          "description": "As a [persona] I want to [action] So that [outcome] — exact wording from PRD",
          "estimated_duration_days": 5,
          "story_points": 8,
          "tangible_deliverables": ["string"],
          "acceptance_criteria": ["Exact AC text from PRD e.g. AC-01: Given... When... Then..."],
          "user_stories": ["string — the full user story text"],
          "edge_cases": ["string — edge cases specific to this story"],
          "priority": "Critical | High | Medium | Low",
          "predecessor_dependencies": []
        }
      ]
    }
  ]
}
CRITICAL: Return ONLY strictly valid JSON. id_key must be globally unique. Extract VERBATIM from PRD — do not hallucinate.`

    console.log(`🤖 [AI Backlog Extraction] Generating WBS from PRD for project: ${projectId}`)
    const result = await generateStructuredJson<{ epics: GeneratedEpic[] }>({
      systemPrompt,
      userPrompt: `--- APPROVED PRODUCT REQUIREMENTS DOCUMENT ---\n\n${prdText}\n\n--- PRODUCT ROADMAP (Context) ---\n\n${roadmapText}`
    })

    if (!result.epics || result.epics.length === 0) {
      return { success: false, error: 'AI failed to extract any Epics or Stories.' }
    }

    // 3. Database Inserts
    const idKeyToUuidMap = new Map<string, string>()

    // Start from 1 so PRD-generated epics appear at the top
    let currentSortOrder = 1
    
    // Store generated Epic IDs for linking
    const generatedEpicIds: string[] = []

    for (const epic of result.epics) {
      // Create Parent Epic
      const epicDeliverablesData = (epic.epic_tangible_deliverables || []).map((text, i) => ({ id: 'del_' + i + '_' + Date.now(), text, completed: false }))
      const epicAcceptanceData = (epic.epic_acceptance_criteria || []).map((text, i) => ({ id: 'acc_' + i + '_' + Date.now(), text, completed: false }))
      const epicUserStoriesData = (epic.epic_user_stories || []).map((text, i) => ({ id: 'us_' + i + '_' + Date.now(), text, completed: false }))
      const epicEdgeCasesData = (epic.epic_edge_cases || []).map((text, i) => ({ id: 'ec_' + i + '_' + Date.now(), text, completed: false }))

      const { data: parentWbs, error: epicErr } = await adminClient
        .from('wbs_elements')
        .insert({
          project_id: projectId,
          name: epic.epic_title,
          description: epic.epic_description,
          is_work_package: false,
          sort_order: currentSortOrder,
          deliverables: epic.epic_tangible_deliverables?.join('\n') || null,
          deliverables_data: epicDeliverablesData,
          acceptance_criteria: epic.epic_acceptance_criteria?.join('\n') || null,
          acceptance_criteria_data: epicAcceptanceData,
          priority: epic.epic_priority || null,
          user_stories: JSON.stringify(epicUserStoriesData),
            edge_cases: JSON.stringify(epicEdgeCasesData),
        })
        .select('id')
        .single()

        if (epicErr || !parentWbs) {
          console.error('Failed to create Epic:', epicErr)
          continue
        }
        
        generatedEpicIds.push(parentWbs.id)
        currentSortOrder += 100

      let wpSortOrder = 10
      const activitiesRows = []
      
      for (const wp of epic.work_packages || []) {
        const wpDeliverablesData = (wp.tangible_deliverables || []).map((text, i) => ({ id: 'del_' + i + '_' + Date.now(), text, completed: false }))
        const wpAcceptanceData = (wp.acceptance_criteria || []).map((text, i) => ({ id: 'acc_' + i + '_' + Date.now(), text, completed: false }))
        const wpUserStoriesData = (wp.user_stories || []).map((text, i) => ({ id: 'us_' + i + '_' + Date.now(), text, completed: false }))
        const wpEdgeCasesData = (wp.edge_cases || []).map((text, i) => ({ id: 'ec_' + i + '_' + Date.now(), text, completed: false }))

        const { data: childWbs, error: childErr } = await adminClient
          .from('wbs_elements')
          .insert({
            project_id: projectId,
            parent_id: parentWbs.id,
            name: wp.title,
            description: wp.description,
            is_work_package: true,
            sort_order: currentSortOrder + wpSortOrder,
            deliverables: wp.tangible_deliverables?.join('\n') || null,
            deliverables_data: wpDeliverablesData,
            acceptance_criteria: wp.acceptance_criteria?.join('\n') || null,
            acceptance_criteria_data: wpAcceptanceData,
            priority: wp.priority || null,
            user_stories: JSON.stringify(wpUserStoriesData),
            edge_cases: JSON.stringify(wpEdgeCasesData),
            story_points: wp.story_points || null,
          })
          .select('id')
          .single()

        if (childErr || !childWbs) {
          console.error('Failed to create Work Package:', childErr)
          continue
        }
        idKeyToUuidMap.set(wp.id_key, childWbs.id)
        
        // Prepare activity row for scheduling
        if (wp.estimated_duration_days && wp.estimated_duration_days > 0) {
          activitiesRows.push({
            project_id: projectId,
            wbs_element_id: childWbs.id,
            name: wp.title,
            duration: wp.estimated_duration_days,
            created_by: 'ai_system'
          })
        }
        wpSortOrder += 10
      }
      
      // Insert Activities
      if (activitiesRows.length > 0) {
        await adminClient.from('activities').insert(activitiesRows)
      }
    }

    // 4. Create Dependencies
    const depRows = []
    for (const epic of result.epics) {
      for (const wp of epic.work_packages || []) {
        const succUuid = idKeyToUuidMap.get(wp.id_key)
        if (!succUuid) continue
        for (const dep of wp.predecessor_dependencies || []) {
          const predUuid = idKeyToUuidMap.get(dep.predecessor_id_key)
          if (predUuid) {
            depRows.push({
              project_id: projectId,
              predecessor_id: predUuid,
              successor_id: succUuid,
              type: dep.type || 'FS',
              lag_days: dep.lag_days || 0
            })
          }
        }
      }
    }
    if (depRows.length > 0) {
      await adminClient.from('wbs_dependencies').insert(depRows)
    }

    // 5. Link Roadmap Initiatives to the new WBS Epic so OKRs are not orphaned
    if (generatedEpicIds.length > 0) {
      const primaryEpicId = generatedEpicIds[0]
      // Fetch NOW items that are not yet linked
      const { data: nowItems } = await adminClient
        .from('product_backlog_items')
        .select('id')
        .eq('project_id', projectId)
        .eq('horizon', 'Now')
        .is('wbs_element_id', null)
        
      if (nowItems && nowItems.length > 0) {
        const itemIds = nowItems.map((i: any) => i.id)
        await adminClient
          .from('product_backlog_items')
          .update({ wbs_element_id: primaryEpicId })
          .in('id', itemIds)
      }
    }

    // Log the event
    await logGovernanceEvent(
      organizationId,
      'ai_generation',
      {
        project_id: projectId,
        resource_type: 'wbs',
        details: { epics_generated: result.epics.length }
      }
    )

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }

  } catch (err: any) {
    console.error('[generateBacklogFromPrdAndRoadmap] Fatal:', err)
    return { success: false, error: err.message || 'Fatal error generating backlog from PRD.' }
  }
}

