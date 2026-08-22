'use server'

import { createClient } from '@/utils/supabase/server'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'

export async function generateStatusReport(projectId: string, aiProvider: string = 'openai') {
  const supabase = await createClient()

  // 1. Fetch WBS Elements
  const { data: wbsData, error: wbsError } = await supabase
    .from('wbs_elements')
    .select('*')
    .eq('project_id', projectId)

  // 2. Fetch Issues
  const { data: issuesData, error: issuesError } = await supabase
    .from('issues')
    .select('*')
    .eq('project_id', projectId)
    .neq('status', 'Closed')

  // 3. Fetch Risks
  const { data: risksData, error: risksError } = await supabase
    .from('risks')
    .select('*')
    .eq('project_id', projectId)
    .neq('status', 'Closed')

  if (wbsError || issuesError || risksError) {
    console.error('Data fetch errors:', { wbsError, issuesError, risksError })
    return { ok: false, error: 'Could not fetch project data. Check console for details.' }
  }

  const prompt = `
    You are an expert Project Manager. Please generate an executive Status Report based on the following raw data.
    
    WBS Elements: ${JSON.stringify(wbsData)}
    Open Issues: ${JSON.stringify(issuesData)}
    Active Risks: ${JSON.stringify(risksData)}

    Write three sections in Markdown format:
    1. Executive Summary: High-level overview of project health, summarizing progress, major blockers, and next steps.
    2. Milestones Status: Detail the progress of key deliverables and schedule health.
    3. Risks & Issues Summary: Highlight the most critical issues and risks, and any schedule/cost variances.
    
    Output strictly a JSON object with the exact following keys:
    {
      "executive_summary": "string",
      "milestones_status": "string",
      "risks_issues": "string"
    }
    Escape newlines as \\n inside strings.
  `

  try {
    const aiResponse = await generateStructuredJson<Record<string, string>>({
      systemPrompt: 'You are an expert Project Manager compiling an executive Status Report. Output only valid JSON based on the provided schema keys. Format your output in rich Markdown.',
      userPrompt: prompt
    })

    return { ok: true, data: aiResponse }
  } catch (err: any) {
    console.error('Error generating status report:', err)
    return { ok: false, error: err.message || 'AI Generation failed' }
  }
}
