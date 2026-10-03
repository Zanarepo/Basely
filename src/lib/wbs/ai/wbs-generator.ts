'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { logGovernanceEvent } from '@/lib/governance/actions'
import { revalidatePath } from 'next/cache'

export interface GeneratedEpic {
  epic_title: string
  epic_description: string
  epic_tangible_deliverables: string[]
  epic_acceptance_criteria: string[]
  epic_user_stories: string[]
  epic_edge_cases: string[]
  epic_priority: 'Critical' | 'High' | 'Medium' | 'Low'
  work_packages: GeneratedWP[]
}

export interface GeneratedWP {
  id_key: string
  title: string
  description: string
  estimated_duration_days: number
  story_points?: number
  tangible_deliverables: string[]
  acceptance_criteria: string[]
  user_stories: string[]
  edge_cases: string[]
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  predecessor_dependencies: { predecessor_id_key: string; type: 'FS'; lag_days: number }[]
}

export async function generateWbsFromScope(
  projectId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()

    // 1. Fetch Scope Statement Document
    const { data: scopeDoc, error: scopeError } = await adminClient
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', 'scope_statement')
      .eq('is_snapshot', false)
      .maybeSingle()

    if (scopeError) throw new Error('Failed to fetch Scope Statement.')
    
    if (!scopeDoc || !scopeDoc.free_text_content || Object.keys(scopeDoc.free_text_content).length === 0) {
      return { success: false, error: 'No Scope Statement found. Please generate or complete the Scope Statement first.' }
    }

    const scopeText = Object.entries(scopeDoc.free_text_content as Record<string, string>)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => `[${k.replace(/_/g, ' ').toUpperCase()}]\n${v}`)
      .join('\n\n')

    if (scopeText.length < 50) {
      return { success: false, error: 'The Scope Statement is too short to generate a WBS.' }
    }

    // 2. Build AI Prompt
    const systemPrompt = `You are Praz-AI, an expert Project Manager. Your task is to auto-generate a comprehensive Work Breakdown Structure (WBS) from the provided Scope Statement.

CRITICAL DOMAIN ADAPTATION & SCHEDULING RULES:
1. Generate authentic, domain-specific tasks based on the scope. Do not use generic software tasks unless it's a software project.
2. Group tasks logically into Major Phases (Epics).
3. Each Work Package MUST list ALL predecessors in "predecessor_dependencies". Use "FS" (Finish-to-Start).
4. Output strictly a JSON object with this exact structure:

{
  "epics": [
    {
      "epic_title": "string (Phase Name)",
      "epic_description": "string",
      "epic_tangible_deliverables": ["string"],
      "epic_acceptance_criteria": ["string"],
      "epic_user_stories": ["string"],
      "epic_edge_cases": ["string"],
      "epic_priority": "High",
      "work_packages": [
        {
          "id_key": "wp_1_unique_across_entire_json",
          "title": "string",
          "description": "string",
          "estimated_duration_days": 3,
          "tangible_deliverables": ["string"],
          "acceptance_criteria": ["string"],
          "user_stories": ["string"],
          "edge_cases": ["string"],
          "priority": "Critical",
          "predecessor_dependencies": []
        },
        {
          "id_key": "wp_2_unique_across_entire_json",
          "title": "string",
          "description": "string",
          "estimated_duration_days": 5,
          "tangible_deliverables": ["string"],
          "acceptance_criteria": ["string"],
          "user_stories": ["string"],
          "edge_cases": ["string"],
          "priority": "High",
          "predecessor_dependencies": [
            { "predecessor_id_key": "wp_1_unique_across_entire_json", "type": "FS", "lag_days": 0 }
          ]
        }
      ]
    }
  ]
}
CRITICAL: Return ONLY strictly valid JSON. Make sure id_key is globally unique across all epics in the JSON.`

    console.log(`🤖 [WBS AI] Generating WBS from Scope for project: ${projectId}`)
    const result = await generateStructuredJson<{ epics: GeneratedEpic[] }>({
      systemPrompt,
      userPrompt: `--- APPROVED SCOPE STATEMENT ---\n\n${scopeText.substring(0, 15000)}`
    })

    if (!result.epics || result.epics.length === 0) {
      return { success: false, error: 'AI failed to generate any WBS elements.' }
    }

    // 3. Database Inserts (Reusing execution logic pattern)
    // We must track id_key to actual UUID mapping for dependencies
    const idKeyToUuidMap = new Map<string, string>()
    
    // Get max sort order to append
    const { data: existingWbs } = await adminClient
      .from('wbs_elements')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1)
    
    let currentSortOrder = existingWbs && existingWbs.length > 0 ? existingWbs[0].sort_order + 100 : 100

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
          created_by: 'ai_system'
        })
        .select('id')
        .single()

      if (epicErr || !parentWbs) {
        console.error('Failed to create parent WBS:', epicErr)
        continue
      }
      currentSortOrder += 100

      let wpSortOrder = 10
      const wpRows = []
      const activitiesRows = []
      
      // We will create the WPs one by one to get their UUIDs for dependencies
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
            created_by: 'ai_system'
          })
          .select('id')
          .single()

        if (childErr || !childWbs) continue

        idKeyToUuidMap.set(wp.id_key, childWbs.id)
        wpSortOrder += 10
        
        // Prepare activity
        activitiesRows.push({
          project_id: projectId,
          wbs_element_id: childWbs.id,
          duration: wp.estimated_duration_days || 1,
          is_milestone: false,
          created_by: 'ai_system'
        })
      }
      currentSortOrder += wpSortOrder

      // Insert Activities
      if (activitiesRows.length > 0) {
        await adminClient.from('activities').insert(activitiesRows)
      }
    }

    // 4. Resolve and insert dependencies
    const dependencyRows = []
    for (const epic of result.epics) {
      for (const wp of epic.work_packages || []) {
        const successorId = idKeyToUuidMap.get(wp.id_key)
        if (!successorId || !wp.predecessor_dependencies) continue

        for (const dep of wp.predecessor_dependencies) {
          const predecessorId = idKeyToUuidMap.get(dep.predecessor_id_key)
          if (predecessorId && predecessorId !== successorId) {
            dependencyRows.push({
              project_id: projectId,
              successor_id: successorId,
              predecessor_id: predecessorId,
              dependency_type: dep.type || 'FS',
              lag: dep.lag_days || 0
            })
          }
        }
      }
    }

    if (dependencyRows.length > 0) {
      await adminClient.from('dependencies').insert(dependencyRows)
    }

    // 5. Log Governance
    await logGovernanceEvent(organizationId, 'ai_generation', {
      action: 'wbs_generation_from_scope',
      project_id: projectId
    }).catch(console.error)

    return { success: true }
  } catch (err: any) {
    console.error('generateWbsFromScope failed:', err)
    return { success: false, error: err.message }
  }
}
