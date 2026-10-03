'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logGovernanceEvent } from '@/lib/governance/actions'
import { z } from 'zod'
import { getAuthenticatedClient } from './core-actions'

// Sprint 51: Project Bridge

const WbsDeconstructionSchema = z.object({
  epic_title: z.string().describe("The high-level title of the epic"),
  epic_description: z.string().describe("The description of the epic"),
  work_packages: z.array(z.object({
    title: z.string().describe("Title of the child work package/task"),
    description: z.string().describe("Description and acceptance criteria"),
    estimated_duration_days: z.number().int().min(1).describe("Estimated duration in days")
  }))
})

export async function convertBacklogItemToExecution(backlogItemId: string) {
  try {
    const { supabase, user } = await getAuthenticatedClient()
    
    // 1. Fetch Backlog Item
    const { data: item, error: fetchError } = await supabase
      .from('product_backlog_items')
      .select('*')
      .eq('id', backlogItemId)
      .single()
      
    if (fetchError || !item) {
      return { success: false, error: fetchError?.message || 'Item not found' }
    }
    
    // 2. Check Governance Setting
    const { data: org } = await supabase
      .from('organizations')
      .select('ai_wbs_generation_enabled')
      .eq('id', item.organization_id)
      .single()
      
    const hasAiKey = Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.OPENAI_API_KEY)
    const useAi = (org?.ai_wbs_generation_enabled !== false) && hasAiKey
    
    let rootElementId: string;
    
    if (useAi) {
      // ----------------------------------------------------
      // OPTION A: RESILIENT MULTI-PROVIDER Praz-AI AUTO-DECONSTRUCT (Groq, Gemini, OpenAI)
      // Uses adminClient for ALL writes to bypass RLS constraints.
      // ----------------------------------------------------
      const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
      const adminClient = createAdminClient()
      
      console.log('🏗️ [Deconstruct] Starting Praz-AI deconstruction for backlog item:', item.title)
      
      const result = await generateStructuredJson<{
        epic_title: string
        epic_description: string
        epic_tangible_deliverables?: string[]
        epic_acceptance_criteria?: string[]
        epic_priority?: string
        epic_user_stories?: string[]
        epic_edge_cases?: string[]
        work_packages: Array<{
          id_key: string
          title: string
          description: string
          estimated_duration_days: number
          tangible_deliverables?: string[]
          acceptance_criteria?: string[]
          priority?: string
          user_stories?: string[]
          edge_cases?: string[]
          predecessor_dependencies?: Array<{
            predecessor_id_key: string
            type: 'FS' | 'SS' | 'FF' | 'SF'
            lag_days?: number
          }>
        }>
      }>({
        systemPrompt: `You are an expert Lead Project Manager & Industry Domain Schedule Analyst. Break down the provided product backlog item into an Epic and an ordered sequence of domain-specific, highly relevant child Work Packages (tasks).

CRITICAL DOMAIN ADAPTATION & SCHEDULING RULES:
1. DOMAIN ADAPTATION: Carefully analyze the domain of the backlog item (e.g., Civil Engineering / Construction, IT / Software, Marketing, Healthcare, Operations, Manufacturing, Finance, etc.).
   - DO NOT generate generic software engineering tasks (such as "Schema/DB", "Backend/API", "Frontend/UI", "Testing & QA") UNLESS the backlog item is explicitly a software development task.
   - For Construction / Civil Engineering items (e.g. "Foundation Works", "Building Construction", "Site Prep"): generate authentic civil engineering tasks (e.g. "Site Excavation & Shoring", "Rebar Steel Framing", "Concrete Pouring & Curing", "Foundation Quality & Soil Inspection").
   - For Marketing items: generate authentic marketing tasks (e.g. "Target Audience Segmentation", "Creative Asset Design & Copy", "Ad Campaign Launch").

2. ORDERED EXECUTION: Arrange work_packages in exact logical sequence of execution (Phase 1 Initial Prep & Design -> Phase 2 Core Execution -> Phase 3 Inspection & Handover).

3. PREDECESSOR DEPENDENCIES — THIS IS CRITICAL:
   - Each work package MUST list ALL tasks it truly depends on in "predecessor_dependencies", not just the immediately preceding one.
   - Use MULTIPLE predecessors when a task cannot start until several earlier tasks are ALL finished. For example, an Inspection/QA task at the end depends on ALL preceding construction tasks, not just one.
   - Example: If wp_4 (Inspection) cannot begin until wp_1 (Excavation), wp_2 (Rebar), AND wp_3 (Concrete) are ALL complete, then wp_4 must list all three as predecessors.
   - "type" should almost always be "FS" (Finish-to-Start). Only use "SS", "FF", or "SF" when there is a clear domain-specific reason.
   - "lag_days": optional lag in days (default 0).

4. DELIVERABLES & CRITERIA (Agile & Waterfall Fields):
   - "tangible_deliverables": 2 to 4 domain-appropriate output artifacts.
   - "acceptance_criteria": 2 to 4 domain-appropriate pass/fail test conditions.
   - "user_stories": 1 to 3 "As a [user]..." format user stories.
   - "edge_cases": 1 to 3 potential edge cases or failure modes to handle.
   - "priority": Select exactly one of: "Critical", "High", "Medium", "Low".

Output strictly a JSON object with this exact structure:
{
  "epic_title": "string",
  "epic_description": "string",
  "epic_tangible_deliverables": ["string"],
  "epic_acceptance_criteria": ["string"],
  "epic_user_stories": ["string"],
  "epic_edge_cases": ["string"],
  "epic_priority": "High",
  "work_packages": [
    {
      "id_key": "wp_1",
      "title": "string (Domain-matched work package title)",
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
      "id_key": "wp_2",
      "title": "string",
      "description": "string",
      "estimated_duration_days": 5,
      "tangible_deliverables": ["string"],
      "acceptance_criteria": ["string"],
      "predecessor_dependencies": [
        { "predecessor_id_key": "wp_1", "type": "FS", "lag_days": 0 }
      ]
    },
    {
      "id_key": "wp_4",
      "title": "Final Inspection (example of MULTIPLE predecessors)",
      "description": "string",
      "estimated_duration_days": 2,
      "tangible_deliverables": ["string"],
      "acceptance_criteria": ["string"],
      "predecessor_dependencies": [
        { "predecessor_id_key": "wp_1", "type": "FS", "lag_days": 0 },
        { "predecessor_id_key": "wp_2", "type": "FS", "lag_days": 0 },
        { "predecessor_id_key": "wp_3", "type": "FS", "lag_days": 0 }
      ]
    }
  ]
}`,
        userPrompt: `Title: ${item.title}\nDescription: ${item.description || 'No description provided.'}`
      })

      console.log('🤖 [Deconstruct] Praz-AI returned', result.work_packages?.length || 0, 'work packages')
      
      // A. Create Parent Epic (is_work_package = false) via adminClient
      const epicDeliverablesData = (result.epic_tangible_deliverables || []).map((text, i) => ({
        id: `del_${i}_${Date.now()}`,
        text,
        completed: false
      }))
      const epicAcceptanceData = (result.epic_acceptance_criteria || []).map((text, i) => ({
        id: `acc_${i}_${Date.now()}`,
        text,
        completed: false
      }))
      const epicUserStoriesData = (result.epic_user_stories || []).map((text, i) => ({
        id: `us_${i}_${Date.now()}`,
        text,
        completed: false
      }))
      const epicEdgeCasesData = (result.epic_edge_cases || []).map((text, i) => ({
        id: `ec_${i}_${Date.now()}`,
        text,
        completed: false
      }))

      const { data: parentWbs, error: epicErr } = await adminClient
        .from('wbs_elements')
        .insert({
          project_id: item.project_id,
          name: result.epic_title,
          description: result.epic_description,
          is_work_package: false,
          sort_order: 100,
          deliverables: result.epic_tangible_deliverables?.join('\n') || null,
          deliverables_data: epicDeliverablesData,
          acceptance_criteria: result.epic_acceptance_criteria?.join('\n') || null,
          acceptance_criteria_data: epicAcceptanceData,
          priority: result.epic_priority || null,
          user_stories: JSON.stringify(epicUserStoriesData),
          edge_cases: JSON.stringify(epicEdgeCasesData),
        })
        .select()
        .single()
        
      if (epicErr) {
        console.error('❌ [Deconstruct] Failed to create parent Epic WBS element:', epicErr)
        throw epicErr
      }
      rootElementId = parentWbs.id
      console.log('✅ [Deconstruct] Created parent Epic:', parentWbs.id, parentWbs.name)
      
      // B. Create Child Work Packages & Activities via adminClient
      const createdActivities: Array<{
        index: number
        activityId: string
        wbsId: string
        idKey?: string
        title: string
        predecessors?: any[]
      }> = []

      let currentSort = 1

      for (let i = 0; i < result.work_packages.length; i++) {
        const wp = result.work_packages[i]
        const wpDeliverablesData = (wp.tangible_deliverables || []).map((text, j) => ({
          id: `del_wp_${j}_${Date.now()}`,
          text,
          completed: false
        }))
        const wpAcceptanceData = (wp.acceptance_criteria || []).map((text, j) => ({
          id: `acc_wp_${j}_${Date.now()}`,
          text,
          completed: false
        }))
        const wpUserStoriesData = (wp.user_stories || []).map((text, j) => ({
          id: `us_wp_${j}_${Date.now()}`,
          text,
          completed: false
        }))
        const wpEdgeCasesData = (wp.edge_cases || []).map((text, j) => ({
          id: `ec_wp_${j}_${Date.now()}`,
          text,
          completed: false
        }))

        const { data: childWbs, error: wpErr } = await adminClient
          .from('wbs_elements')
          .insert({
            project_id: item.project_id,
            parent_id: rootElementId,
            name: wp.title,
            description: wp.description,
            is_work_package: true,
            sort_order: currentSort++,
            deliverables: wp.tangible_deliverables?.join('\n') || null,
            deliverables_data: wpDeliverablesData,
            acceptance_criteria: wp.acceptance_criteria?.join('\n') || null,
            acceptance_criteria_data: wpAcceptanceData,
            priority: wp.priority || null,
            user_stories: JSON.stringify(wpUserStoriesData),
            edge_cases: JSON.stringify(wpEdgeCasesData),
          })
          .select()
          .single()
          
        if (wpErr || !childWbs) {
          console.error(`❌ [Deconstruct] Failed to create WBS child "${wp.title}":`, wpErr)
          continue
        }
        
        // C. Get or create Activity for the Work Package
        // A database trigger may auto-create an activity when is_work_package=true WBS elements are inserted.
        // Check for existing activity first, then insert only if none exists.
        let activityId: string | null = null

        const { data: existingAct } = await adminClient
          .from('activities')
          .select('id')
          .eq('wbs_element_id', childWbs.id)
          .maybeSingle()

        if (existingAct) {
          // Activity was auto-created by trigger — update its name/duration to match Praz-AI output
          activityId = existingAct.id
          await adminClient
            .from('activities')
            .update({ name: wp.title, duration: wp.estimated_duration_days || 1 })
            .eq('id', existingAct.id)
          console.log(`🔄 [Deconstruct] Reused trigger-created activity for "${wp.title}" → ${existingAct.id}`)
        } else {
          const { data: newAct, error: actErr } = await adminClient
            .from('activities')
            .insert({
              project_id: item.project_id,
              wbs_element_id: childWbs.id,
              name: wp.title,
              duration: wp.estimated_duration_days || 1
            })
            .select('id')
            .single()

          if (actErr || !newAct) {
            console.error(`❌ [Deconstruct] Failed to create activity for "${wp.title}":`, actErr)
            continue
          }
          activityId = newAct.id
          console.log(`✅ [Deconstruct] Created new activity for "${wp.title}" → ${newAct.id}`)
        }

        if (!activityId) continue

        console.log(`✅ [Deconstruct] Created WP "${wp.title}" → activity ${activityId}, predecessors:`, wp.predecessor_dependencies)
        createdActivities.push({
          index: createdActivities.length,
          activityId: activityId,
          wbsId: childWbs.id,
          idKey: wp.id_key,
          title: wp.title,
          predecessors: wp.predecessor_dependencies
        })
      }

      console.log(`📊 [Deconstruct] Total created activities: ${createdActivities.length}`)

      // D. Insert Predecessor Dependencies (FS, SS, FF, SF) into 'dependencies' table
      const keyToActMap = new Map<string, { activityId: string; index: number }>()
      const titleToActMap = new Map<string, { activityId: string; index: number }>()

      for (const itemAct of createdActivities) {
        if (itemAct.idKey) keyToActMap.set(itemAct.idKey, { activityId: itemAct.activityId, index: itemAct.index })
        if (itemAct.title) titleToActMap.set(itemAct.title.toLowerCase().trim(), { activityId: itemAct.activityId, index: itemAct.index })
      }

      let totalDepsInserted = 0

      for (let idx = 0; idx < createdActivities.length; idx++) {
        const current = createdActivities[idx]
        const insertedPreds = new Set<string>()

        if (current.predecessors && current.predecessors.length > 0) {
          for (const dep of current.predecessors) {
            let predMatch: { activityId: string; index: number } | undefined = undefined

            if (dep.predecessor_id_key) {
              predMatch = keyToActMap.get(dep.predecessor_id_key) ||
                          titleToActMap.get(dep.predecessor_id_key.toLowerCase().trim())
            }

            if (!predMatch && (dep as any).predecessor_title) {
              predMatch = titleToActMap.get((dep as any).predecessor_title.toLowerCase().trim())
            }

            if (
              predMatch &&
              predMatch.activityId !== current.activityId &&
              predMatch.index < current.index &&
              !insertedPreds.has(predMatch.activityId)
            ) {
              insertedPreds.add(predMatch.activityId)
              const { error: depErr } = await adminClient.from('dependencies').insert({
                project_id: item.project_id,
                predecessor_id: predMatch.activityId,
                successor_id: current.activityId,
                type: ['FS', 'SS', 'FF', 'SF'].includes(dep.type) ? dep.type : 'FS',
                lag_days: typeof dep.lag_days === 'number' ? dep.lag_days : 0
              })
              if (depErr) {
                console.error(`❌ [Deconstruct] Failed to insert Praz-AI dep for "${current.title}":`, depErr)
              } else {
                totalDepsInserted++
                console.log(`🔗 [Deconstruct] Linked: "${createdActivities[predMatch.index]?.title}" → "${current.title}"`)
              }
            }
          }
        }

        // Guaranteed Fallback: If idx > 0 and no predecessors were inserted, link to previous task in execution order
        if (idx > 0 && insertedPreds.size === 0) {
          const prev = createdActivities[idx - 1]
          if (prev && prev.activityId !== current.activityId) {
            const { error: fallbackErr } = await adminClient.from('dependencies').insert({
              project_id: item.project_id,
              predecessor_id: prev.activityId,
              successor_id: current.activityId,
              type: 'FS',
              lag_days: 0
            })
            if (fallbackErr) {
              console.error(`❌ [Deconstruct] Failed to insert fallback dep for "${current.title}":`, fallbackErr)
            } else {
              totalDepsInserted++
              console.log(`🔗 [Deconstruct] Fallback linked: "${prev.title}" → "${current.title}"`)
            }
          }
        }
      }

      console.log(`✅ [Deconstruct] Total dependencies inserted: ${totalDepsInserted}`)

      // E. Create a Milestone for the Epic
      // A Milestone is a WBS element (is_work_package = true) whose Activity has duration = 0
      const milestoneTitle = `🎯 ${result.epic_title} - Completion Milestone`
      const { data: milestoneWbs, error: milestoneErr } = await adminClient
        .from('wbs_elements')
        .insert({
          project_id: item.project_id,
          parent_id: rootElementId,
          name: milestoneTitle,
          description: `Automatically generated milestone marking the completion of: ${result.epic_title}`,
          is_work_package: true,
          sort_order: currentSort++, // Put it at the very end
        })
        .select()
        .single()

      if (milestoneErr || !milestoneWbs) {
        console.error(`❌ [Deconstruct] Failed to create Milestone WBS element:`, milestoneErr)
      } else {
        // Get or create the Activity for the Milestone
        let milestoneActivityId: string | null = null
        const { data: existingMilestoneAct } = await adminClient
          .from('activities')
          .select('id')
          .eq('wbs_element_id', milestoneWbs.id)
          .maybeSingle()

        if (existingMilestoneAct) {
          milestoneActivityId = existingMilestoneAct.id
          await adminClient
            .from('activities')
            .update({ name: milestoneTitle, duration: 0, type: 'Milestone' })
            .eq('id', existingMilestoneAct.id)
        } else {
          const { data: newMilestoneAct, error: actErr } = await adminClient
            .from('activities')
            .insert({
              project_id: item.project_id,
              wbs_element_id: milestoneWbs.id,
              name: milestoneTitle,
              duration: 0,
              type: 'Milestone'
            })
            .select('id')
            .single()
            
          if (!actErr && newMilestoneAct) {
            milestoneActivityId = newMilestoneAct.id
          }
        }

        if (milestoneActivityId) {
          console.log(`✅ [Deconstruct] Created Milestone "${milestoneTitle}" → activity ${milestoneActivityId}`)
          
          // Link ALL created work packages to this milestone as FS dependencies
          let milestoneDepsInserted = 0
          for (const wpAct of createdActivities) {
             const { error: mDepErr } = await adminClient.from('dependencies').insert({
                project_id: item.project_id,
                predecessor_id: wpAct.activityId,
                successor_id: milestoneActivityId,
                type: 'FS',
                lag_days: 0
              })
              if (!mDepErr) milestoneDepsInserted++
          }
          console.log(`🔗 [Deconstruct] Linked ${milestoneDepsInserted} tasks to the completion milestone.`)
        }
      }

      // F. Recalculate schedule (CPM dates & float)
      const { recalculateSchedule } = await import('@/lib/schedule/actions/recalculate')
      await recalculateSchedule(item.project_id)
      
      await logGovernanceEvent(item.organization_id, 'ai_generation', {
        action: 'wbs_auto_deconstruct',
        item_id: item.id
      })
      
    } else {
      // ----------------------------------------------------
      // OPTION B: MANUAL EPIC SHELL
      // ----------------------------------------------------
      const { data: parentWbs, error: epicErr } = await supabase
        .from('wbs_elements')
        .insert({
          project_id: item.project_id,
          name: item.title,
          description: item.description,
          is_work_package: false, // PM will break it down manually
          sort_order: 100,
        })
        .select()
        .single()
        
      if (epicErr) throw epicErr
      rootElementId = parentWbs.id
    }
    
    // 3. Link back to the Product Backlog Item
    const { error: updateErr } = await supabase
      .from('product_backlog_items')
      .update({ wbs_element_id: rootElementId })
      .eq('id', item.id)
      
    if (updateErr) throw updateErr
    
    revalidatePath(`/dashboard/projects/${item.project_id}`)
    return { success: true, data: { wbs_element_id: rootElementId, usedAi: useAi } }
    
  } catch (err: any) {
    console.error("convertBacklogItemToExecution failed:", err)
    return { success: false, error: err.message }
  }
}

/**
 * Automatically generates Product Backlog Items (with RICE scores) from a Customer Persona's pain points and JTBD using Praz-AI.
 */
export async function autoGenerateBacklogFromPersona(personaId: string, projectId: string, organizationId: string) {
  try {
    const { supabase } = await getAuthenticatedClient()

    // 1. Fetch the Persona
    const { data: persona, error: pErr } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single()

    if (pErr || !persona) {
      throw new Error(pErr?.message || 'Persona not found')
    }

    if (!persona.pain_points && !persona.jtbd_statement) {
       throw new Error('Persona has no Pain Points or Jobs To Be Done to analyze.')
    }

    // 2. Praz-AI Generation
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    const result = await generateStructuredJson<{
      backlog_items: Array<{
        title: string
        description: string
        reach: number
        impact: number
        confidence: number
        effort: number
      }>
    }>({
      systemPrompt: `You are an expert Lead Product Manager. Your task is to analyze a Customer Persona, particularly their Pain Points and Jobs To Be Done (JTBD), and generate 3 to 5 high-value Product Backlog Items (features, user stories, or epics) that directly solve these problems.

For EACH backlog item, you MUST estimate its RICE score:
- reach: Number of users impacted per month (estimate between 1 and 1000).
- impact: How much it increases value (choose from: 3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal).
- confidence: Your confidence in these estimates (percentage between 50 and 100).
- effort: Person-months of engineering time (estimate between 1 and 50).

Output strictly a JSON object matching this schema:
{
  "backlog_items": [
    {
      "title": "Short actionable title",
      "description": "Detailed description explaining how this solves the persona's pain point.",
      "reach": 500,
      "impact": 2,
      "confidence": 80,
      "effort": 10
    }
  ]
}`,
      userPrompt: `Persona Name: ${persona.name}
Role: ${persona.role_title}
Demographics: ${persona.demographics || 'N/A'}
Jobs To Be Done: ${persona.jtbd_statement || 'N/A'}
Pain Points: ${persona.pain_points || 'N/A'}
Motivations: ${persona.motivations || 'N/A'}`
    })

    if (!result.backlog_items || result.backlog_items.length === 0) {
      throw new Error('Praz-AI failed to generate any backlog items.')
    }

    // 3. Insert generated items into the database
    const adminClient = createAdminClient()
    let insertedCount = 0

    for (const item of result.backlog_items) {
      const { error: insErr } = await adminClient
        .from('product_backlog_items')
        .insert({
          project_id: projectId,
          organization_id: organizationId,
          title: item.title,
          description: item.description,
          reach: item.reach,
          impact: item.impact,
          confidence: item.confidence,
          effort: item.effort,
          moscow_status: null, // Left null because we are prioritizing via RICE scores
        })

      if (insErr) {
        console.error('Error inserting generated backlog item:', insErr)
      } else {
        insertedCount++
      }
    }

    await logGovernanceEvent(organizationId, 'ai_generation', {
      action: 'persona_backlog_generation',
      persona_id: personaId,
      items_created: insertedCount
    })

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, count: insertedCount }

  } catch (err: any) {
    console.error("autoGenerateBacklogFromPersona failed:", err)
    return { success: false, error: err.message }
  }
}

