'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationSubscription } from '@/lib/organizations/tier-core'
import { getOrganizationAiEnabled } from '@/lib/organizations/tier-access'
import { generateStructuredJson } from '@/lib/ai/ai-provider-router'
import { createRisk } from './actions'

export type AiGeneratedRisk = {
  title: string
  description: string
  probability: 'High' | 'Medium' | 'Low'
  impact: 'High' | 'Medium' | 'Low'
  response_strategy: string
}

export async function generateRisksFromDocuments(
  projectId: string,
  organizationId: string
): Promise<{ ok: boolean; data?: AiGeneratedRisk[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { ok: false, error: 'Unauthorized' }
    }

    // 1. Verify Tier & Gating logic
    const sub = await getOrganizationSubscription(organizationId)
    const isEnterprise = sub.tierId === 'enterprise'
    const isPremium = sub.tierId === 'premium'



    if (isPremium) {
      const aiEnabled = await getOrganizationAiEnabled(organizationId)
      if (!aiEnabled) {
        return { ok: false, error: 'Praz-AI Features are currently disabled for this Premium workspace. Contact support to enable them.' }
      }
    }

    // 2. Fetch Project Charter, Scope Statement, Budget, and Schedule
    const { data: documents, error: docsError } = await supabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .eq('is_snapshot', false)
      .in('document_type', ['charter', 'scope_statement', 'budget_baseline', 'schedule_document'])

    if (docsError) {
      console.error('Fetch docs error:', docsError)
      return { ok: false, error: `Failed to fetch project documents: ${docsError.message}` }
    }

    const charterDoc = documents?.find(d => d.document_type === 'charter')
    const scopeDoc = documents?.find(d => d.document_type === 'scope_statement')
    const budgetDoc = documents?.find(d => d.document_type === 'budget_baseline')
    const scheduleDoc = documents?.find(d => d.document_type === 'schedule_document')

    let combinedContext = ''

    if (charterDoc?.free_text_content) {
      combinedContext += `--- PROJECT CHARTER ---\n${JSON.stringify(charterDoc.free_text_content)}\n\n`
    }
    
    if (scopeDoc?.free_text_content) {
      combinedContext += `--- SCOPE STATEMENT ---\n${JSON.stringify(scopeDoc.free_text_content)}\n\n`
    }

    if (budgetDoc?.free_text_content) {
      combinedContext += `--- BUDGET BASELINE ---\n${JSON.stringify(budgetDoc.free_text_content)}\n\n`
    }

    if (scheduleDoc?.free_text_content) {
      combinedContext += `--- SCHEDULE DOCUMENT ---\n${JSON.stringify(scheduleDoc.free_text_content)}\n\n`
    }

    if (combinedContext.length < 100) {
      return { ok: false, error: 'Not enough content in the Project documents to analyze risks. Please complete them first.' }
    }

    // 3. Formulate Prompt
    const systemPrompt = `You are an expert Project Risk Manager and Praz-AI.
Your task is to review the provided Project Charter, Scope Statement, Budget Baseline, and Schedule Document simultaneously (Multi-Document Synthesis).
Identify potential threats by looking for inconsistencies across the documents. For example, explicitly look for:
- Aggressive timelines paired with low budgets
- Ambitious scope paired with aggressive timelines
- Missing external dependencies or budget reserves

Output a JSON object exactly matching this schema:
{
  "risks": [
    {
      "title": "Short, clear title of the risk (max 6 words)",
      "description": "Detailed explanation of the risk, its cause, and how it was deduced from cross-referencing the documents.",
      "probability": "High | Medium | Low",
      "impact": "High | Medium | Low",
      "response_strategy": "Actionable mitigation or contingency strategy"
    }
  ]
}
Identify exactly 3 to 5 critical risks.`

    const userPrompt = `
      DOCUMENTS TO ANALYZE:
      ${combinedContext.substring(0, 30000)} // Ensure we don't blow up token limits, but 30k chars is well within safe limits
      
      Extract the cross-document risks now.
    `

    const result = await generateStructuredJson<{ risks: AiGeneratedRisk[] }>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.risks || result.risks.length === 0) {
      return { ok: false, error: 'Praz-AI failed to generate risks.' }
    }

    // 4. Save to Database
    let successCount = 0
    for (const risk of result.risks) {
      const dbResult = await createRisk(projectId, {
        title: risk.title,
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact,
        response_strategy: risk.response_strategy,
        status: 'Identified',
      })
      if (dbResult.ok) successCount++
    }

    if (successCount === 0) {
      return { ok: false, error: 'Failed to save generated risks to the database.' }
    }

    return { ok: true, data: result.risks }
  } catch (err: any) {
    console.error('[generateRisksFromDocuments Error]:', err)
    return { ok: false, error: err.message || 'Unknown error occurred during AI Risk Generation.' }
  }
}

export async function scanExecutionRisks(
  projectId: string
): Promise<{ ok: boolean; data?: AiGeneratedRisk[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { ok: false, error: 'Unauthorized' }
    }

    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return { ok: false, error: 'Project not found.' }
    }
    const organizationId = project.organization_id

    // 1. Verify Tier & Gating logic
    const sub = await getOrganizationSubscription(organizationId)
    const isEnterprise = sub.tierId === 'enterprise'
    const isPremium = sub.tierId === 'premium'



    if (isPremium) {
      const aiEnabled = await getOrganizationAiEnabled(organizationId)
      if (!aiEnabled) {
        return { ok: false, error: 'Praz-AI Features are currently disabled for this Premium workspace. Contact support to enable them.' }
      }
    }

    // 2. Fetch Project Requirements Document and Product Backlog
    const { data: documents, error: docsError } = await supabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .eq('is_snapshot', false)
      .in('document_type', ['product_requirements_document', 'product_backlog'])

    if (docsError) {
      console.error('Fetch docs error:', docsError)
      return { ok: false, error: `Failed to fetch product documents: ${docsError.message}` }
    }

    const prdDoc = documents?.find(d => d.document_type === 'product_requirements_document')
    const backlogDoc = documents?.find(d => d.document_type === 'product_backlog')

    // 3. Fetch WBS
    const { data: wbs, error: wbsError } = await supabase
      .from('wbs_elements')
      .select('name, description, status')
      .eq('project_id', projectId)

    if (wbsError) {
      console.error('Fetch WBS error:', wbsError)
      return { ok: false, error: `Failed to fetch WBS: ${wbsError.message}` }
    }

    let combinedContext = ''

    if (prdDoc?.free_text_content) {
      combinedContext += `--- PRODUCT REQUIREMENTS DOCUMENT ---\n${JSON.stringify(prdDoc.free_text_content)}\n\n`
    }
    
    if (backlogDoc?.free_text_content) {
      combinedContext += `--- PRODUCT BACKLOG ---\n${JSON.stringify(backlogDoc.free_text_content)}\n\n`
    }

    if (wbs && wbs.length > 0) {
      combinedContext += `--- WORK BREAKDOWN STRUCTURE (WBS) ---\n${JSON.stringify(wbs)}\n\n`
    }

    if (combinedContext.length < 50) {
      return { ok: false, error: 'Not enough content in the PRD, Backlog, or WBS to analyze execution risks. Please build out your product and execution scope first.' }
    }

    // 4. Formulate Prompt
    const systemPrompt = `You are an expert Technical Project Manager and Praz-AI.
Your task is to analyze the provided Product Requirements Document (PRD), Product Backlog, and Work Breakdown Structure (WBS).
Identify execution-level threats by looking for:
1. Scope Creep potential or ambiguous features in the PRD/Backlog.
2. Technical Complexity or lack of clarity in execution (WBS).
3. Schedule bottlenecks or missing dependencies.

Output a JSON object exactly matching this schema:
{
  "risks": [
    {
      "title": "Short, clear title of the risk (max 6 words)",
      "description": "Detailed explanation of the risk, its cause, and how it was deduced from the execution data.",
      "probability": "High | Medium | Low",
      "impact": "High | Medium | Low",
      "response_strategy": "Actionable mitigation or contingency strategy"
    }
  ]
}
Identify exactly 3 to 5 critical execution risks.`

    const userPrompt = `
      EXECUTION DATA TO ANALYZE:
      ${combinedContext.substring(0, 30000)} // Max 30k chars
      
      Extract the execution risks now.
    `

    const result = await generateStructuredJson<{ risks: AiGeneratedRisk[] }>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.risks || result.risks.length === 0) {
      return { ok: false, error: 'Praz-AI failed to generate risks from the execution data.' }
    }

    return { ok: true, data: result.risks }
  } catch (err: any) {
    console.error('[scanExecutionRisks Error]:', err)
    return { ok: false, error: err.message || 'Unknown error occurred during AI Risk Scan.' }
  }
}
