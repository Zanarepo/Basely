const fs = require('fs');
const file = 'src/lib/wbs/wbs-ai-actions.ts';
let content = fs.readFileSync(file, 'utf8');

const newFunctions = `

// ==========================================
// 12-STEP CHAIN: STEP 12
// Extract Backlog from PRD & Roadmap
// ==========================================
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
      .map(([k, v]) => \`[\${k.toUpperCase()}]\\n\${v}\`)
      .join('\\n\\n')

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
        .map(([k, v]) => \`[\${k.toUpperCase()}]\\n\${v}\`)
        .join('\\n\\n')
    }

    // 2. Build AI Prompt
    const systemPrompt = \`You are Praz-AI, a Senior Agile Product Owner. Your task is to extract a strict execution backlog (Epics and User Stories) from the provided Product Requirements Document (PRD) and Roadmap.

CRITICAL DOMAIN RULES:
1. Break down the PRD features into distinct Epics.
2. For each Epic, define specific User Stories (Work Packages).
3. Extract exact acceptance criteria and edge cases from the PRD.
4. Each Work Package MUST list ALL predecessors in "predecessor_dependencies". Use "FS" (Finish-to-Start).
5. Output strictly a JSON object with this exact structure:

{
  "epics": [
    {
      "epic_title": "string (Epic Name)",
      "epic_description": "string",
      "epic_tangible_deliverables": ["string"],
      "epic_acceptance_criteria": ["string"],
      "epic_user_stories": ["string"],
      "epic_edge_cases": ["string"],
      "epic_priority": "High",
      "work_packages": [
        {
          "id_key": "wp_1_unique_across_entire_json",
          "title": "string (As a user, I can...)",
          "description": "string",
          "estimated_duration_days": 3,
          "tangible_deliverables": ["string"],
          "acceptance_criteria": ["string"],
          "user_stories": ["string"],
          "edge_cases": ["string"],
          "priority": "Critical",
          "predecessor_dependencies": []
        }
      ]
    }
  ]
}
CRITICAL: Return ONLY strictly valid JSON. Make sure id_key is globally unique across all epics.\`

    console.log(\`🤖 [AI Backlog Extraction] Generating WBS from PRD for project: \${projectId}\`)
    const result = await generateStructuredJson<{ epics: GeneratedEpic[] }>({
      systemPrompt,
      userPrompt: \`--- APPROVED PRODUCT REQUIREMENTS DOCUMENT ---\\n\\n\${prdText}\\n\\n--- PRODUCT ROADMAP (Context) ---\\n\\n\${roadmapText}\`
    })

    if (!result.epics || result.epics.length === 0) {
      return { success: false, error: 'AI failed to extract any Epics or Stories.' }
    }

    // 3. Database Inserts
    const idKeyToUuidMap = new Map<string, string>()
    
    // Get max sort order
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
          deliverables: epic.epic_tangible_deliverables?.join('\\n') || null,
          deliverables_data: epicDeliverablesData,
          acceptance_criteria: epic.epic_acceptance_criteria?.join('\\n') || null,
          acceptance_criteria_data: epicAcceptanceData,
          priority: epic.epic_priority || null,
          user_stories: JSON.stringify(epicUserStoriesData),
          edge_cases: JSON.stringify(epicEdgeCasesData),
          created_by: 'ai_system'
        })
        .select('id')
        .single()

      if (epicErr || !parentWbs) {
        console.error('Failed to create Epic:', epicErr)
        continue
      }
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
            deliverables: wp.tangible_deliverables?.join('\\n') || null,
            deliverables_data: wpDeliverablesData,
            acceptance_criteria: wp.acceptance_criteria?.join('\\n') || null,
            acceptance_criteria_data: wpAcceptanceData,
            priority: wp.priority || null,
            user_stories: JSON.stringify(wpUserStoriesData),
            edge_cases: JSON.stringify(wpEdgeCasesData),
            created_by: 'ai_system'
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
      await adminClient.from('dependencies').insert(depRows)
    }

    // Log the event
    await logGovernanceEvent(adminClient, {
      project_id: projectId,
      organization_id: organizationId,
      action: 'AI_BACKLOG_GENERATED',
      resource_type: 'wbs',
      details: { epics_generated: result.epics.length }
    })

    return { success: true }

  } catch (err: any) {
    console.error('[generateBacklogFromPrdAndRoadmap] Fatal:', err)
    return { success: false, error: err.message || 'Fatal error generating backlog from PRD.' }
  }
}
`;

if (!content.includes('generateBacklogFromPrdAndRoadmap')) {
  content += newFunctions;
  fs.writeFileSync(file, content);
  console.log('Appended step 12 chain function successfully.');
} else {
  console.log('Function already exists.');
}
