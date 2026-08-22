'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

/** Truncate an array to at most `max` items and stringify, capping total length */
function summarizeData(data: any[] | null, max = 15, maxChars = 3000): string {
  if (!data || data.length === 0) return 'None recorded.'
  const sliced = data.slice(0, max)
  const str = JSON.stringify(sliced, null, 0)
  if (str.length > maxChars) return str.slice(0, maxChars) + '...(truncated)'
  const suffix = data.length > max ? ` ...(${data.length - max} more omitted)` : ''
  return str + suffix
}

export async function generateClosureSynthesis(projectId: string, docType: 'lessons_learned' | 'post_implementation_review', aiProvider: string = 'openai') {
  const supabase = await createClient()

  // 1. Fetch Project Details
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  // 2. Fetch WBS Elements
  const { data: wbsData } = await supabase
    .from('wbs_elements')
    .select('*')
    .eq('project_id', projectId)

  // 3. Fetch Issues
  const { data: issuesData } = await supabase
    .from('issues')
    .select('*')
    .eq('project_id', projectId)

  // 4. Fetch Risks
  const { data: risksData } = await supabase
    .from('risks')
    .select('*')
    .eq('project_id', projectId)

  if (projectError) {
    console.error('[ai-closure-actions] Project data fetch error:', projectError)
    return { ok: false, error: 'Could not fetch project data.' }
  }

  const projectContext = `
    Project Name: ${projectData?.name || 'Unknown'}
    Description: ${projectData?.description || 'N/A'}
    Objectives: ${projectData?.objectives || 'N/A'}
    Target Launch Date: ${projectData?.target_launch_date || 'N/A'}
  `

  let prompt = ''
  let systemPrompt = ''

  if (docType === 'lessons_learned') {
    systemPrompt = 'You are an expert Project Manager compiling a Lessons Learned document at the end of a project. Output only valid JSON. Format strings using rich Markdown.'
    prompt = `
      Based on the following project history, generate a comprehensive Lessons Learned synthesis.
      
      ${projectContext}
      WBS Elements: ${summarizeData(wbsData)}
      Issues Encountered: ${summarizeData(issuesData)}
      Risks Tracked: ${summarizeData(risksData)}

      Analyze the issues and risks to determine what went wrong (Challenges).
      Analyze the completed WBS deliverables to infer what went well (Successes).
      Provide actionable recommendations for future projects based on these learnings.

      Output strictly a JSON object with the exact following keys:
      {
        "executive_context": "string (Brief summary of the project execution and overall takeaway)",
        "what_worked_well": "string (Bulleted list of successes, good processes, and wins)",
        "what_did_not_work": "string (Bulleted list of challenges, obstacles, and failures)",
        "recommendations_for_future": "string (Actionable advice for the next project team)"
      }
      Escape newlines as \\n inside strings.
    `
  } else if (docType === 'post_implementation_review') {
    systemPrompt = 'You are an expert Project Manager compiling a Post-Implementation Review (PIR) document. Output only valid JSON. Format strings using rich Markdown.'
    prompt = `
      Based on the following project history, generate a comprehensive Post-Implementation Review (PIR).
      
      ${projectContext}
      WBS Elements: ${summarizeData(wbsData)}
      Issues Encountered: ${summarizeData(issuesData)}
      Risks Tracked: ${summarizeData(risksData)}

      Focus on the business outcomes, whether the original objectives were met, the ROI realization based on the final deliverables, and long-term recommendations.

      Output strictly a JSON object with the exact following keys:
      {
        "outcome_assessment": "string (Assessment of whether the project met its goals and delivered the intended value)",
        "roi_and_business_impact": "string (Analysis of the business impact and ROI realization)",
        "recommendations": "string (Long-term strategic recommendations for the product/business)"
      }
      Escape newlines as \\n inside strings.
    `
  }

  try {
    const aiResponse = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: prompt
    })

    return { ok: true, data: aiResponse }
  } catch (err: any) {
    // Log full provider details on the server only
    console.error('[ai-closure-actions] AI Generation failed (full details):', err.message || err)
    // Return a clean, user-friendly message to the frontend
    return { ok: false, error: 'AI generation is temporarily unavailable. Please try again in a few minutes.' }
  }
}
