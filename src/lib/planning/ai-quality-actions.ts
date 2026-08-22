'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

interface AiQualityResponse {
  reviewCadence: string
  qualityStandards: {
    title: string
    isChecklist: boolean
    applicableWbsCodes: string[]
  }[]
}

export async function generateQualityPlanFromWbs(projectId: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch WBS Elements for context
    const { data: elements, error: wbsError } = await supabase
      .from('wbs_elements')
      .select('id, code, name, description, is_work_package, deliverables, acceptance_criteria')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (wbsError || !elements || elements.length === 0) {
      return { ok: false, error: 'Failed to fetch WBS elements or WBS is empty.' }
    }

    // Prepare WBS context summary
    const wbsSummary = elements
      .map(e => `[${e.code}] ${e.name} ${e.is_work_package ? '(Work Package)' : '(Summary Phase)'} - Desc: ${e.description || 'None'}`)
      .join('\n')

    // 2. Build Prompts
    const systemPrompt = `You are a professional Project Management AI (Praz-AI Engine).
Your task is to analyze the provided Work Breakdown Structure (WBS) and automatically generate a robust Quality Management Plan.
The plan must contain:
1. A recommended "Review Cadence" (e.g. "Weekly reviews", "End of Sprint Demo", "Phase Gate Reviews").
2. A list of 4 to 8 highly tailored "Quality Standards" (checks) that developers or team members must sign off on before marking a work package as 100% complete.
   - Tailor the standards to the specific type of project described in the WBS.
   - isChecklist should be true for simple boolean criteria, false for prose standards.
   - For each standard, specify which exact Work Package codes (e.g., "1.1", "2.3") it applies to in the "applicableWbsCodes" array. If it applies globally to all work packages, output ["ALL"]. Do not map standards to Summary Phases, only Work Packages.`

    const userPrompt = `Project WBS:\n${wbsSummary}\n\nPlease generate a tailored Quality Management Plan using the following JSON schema:
{
  "reviewCadence": "string",
  "qualityStandards": [
    {
      "title": "string",
      "isChecklist": boolean,
      "applicableWbsCodes": ["string"]
    }
  ]
}`

    // 3. Call AI
    const result = await generateStructuredJson<AiQualityResponse>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.reviewCadence || !result.qualityStandards) {
      return { ok: false, error: 'AI returned malformed or empty response.' }
    }

    // 4. Save to Database
    const { data: plan, error: planError } = await supabase
      .from('quality_management_plans')
      .upsert(
        { project_id: projectId, review_cadence: result.reviewCadence },
        { onConflict: 'project_id' }
      )
      .select('id')
      .single()

    if (planError || !plan) {
      return { ok: false, error: 'Failed to save Quality Management Plan.' }
    }

    // Clear existing standards to replace them (cascade will delete links)
    await supabase.from('quality_standards').delete().eq('plan_id', plan.id)

    // Insert new standards and their element links
    if (result.qualityStandards.length > 0) {
      const inserts = result.qualityStandards.map(std => ({
        plan_id: plan.id,
        criterion_text: std.title,
        is_checklist_item: std.isChecklist
      }))
      
      const { data: insertedStandards, error: stdError } = await supabase
        .from('quality_standards')
        .insert(inserts)
        .select('id, criterion_text')
      
      if (stdError || !insertedStandards) {
        console.error('Failed to insert quality standards', stdError)
        return { ok: false, error: 'Failed to insert generated Quality Standards.' }
      }

      // 5. Create Links
      const linksToInsert: { wbs_element_id: string, quality_standard_id: string }[] = []
      
      result.qualityStandards.forEach(std => {
        const dbStandard = insertedStandards.find(s => s.criterion_text === std.title)
        if (!dbStandard) return

        if (std.applicableWbsCodes.includes('ALL')) {
          // Link to all work packages
          elements.filter(e => e.is_work_package).forEach(e => {
            linksToInsert.push({
              wbs_element_id: e.id,
              quality_standard_id: dbStandard.id
            })
          })
        } else {
          // Link to specific codes
          std.applicableWbsCodes.forEach(code => {
            const el = elements.find(e => e.code === code && e.is_work_package)
            if (el) {
              linksToInsert.push({
                wbs_element_id: el.id,
                quality_standard_id: dbStandard.id
              })
            }
          })
        }
      })

      if (linksToInsert.length > 0) {
        const { error: linksError } = await supabase.from('wbs_quality_standard_links').insert(linksToInsert)
        if (linksError) {
          console.error('Failed to insert quality links', linksError)
        }
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('Error in generateQualityPlanFromWbs:', err)
    return { ok: false, error: err.message || 'An unexpected error occurred.' }
  }
}
