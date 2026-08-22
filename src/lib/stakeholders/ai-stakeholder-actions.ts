'use server'

import { createClient } from '@/utils/supabase/server'
import { getOrganizationSubscription } from '@/lib/organizations/tier-logic'
import { getOrganizationAiEnabled } from '@/lib/organizations/tier-access'

export type AiStakeholderSuggestion = {
  name: string
  role_title: string
  organization_type: 'internal' | 'external'
  sub_category?: string
  influence: number
  interest: number
  communication_preference?: string
  rationale: string
}

export async function generateStakeholdersFromContextAction(
  organizationId: string,
  projectId: string
): Promise<{ ok: boolean; data?: AiStakeholderSuggestion[]; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Verify Tier & Gating logic
    const sub = await getOrganizationSubscription(organizationId)
    const isEnterprise = sub.tierId === 'enterprise'
    const isPremium = sub.tierId === 'premium'

    if (!isEnterprise && !isPremium) {
      return { ok: false, error: 'Praz-AI Stakeholder Generation is only available on Premium and Enterprise plans.' }
    }

    if (isPremium) {
      const aiEnabled = await getOrganizationAiEnabled(organizationId)
      if (!aiEnabled) {
        return { ok: false, error: 'Praz-AI Features are currently disabled for this Premium workspace. Contact support to enable them.' }
      }
    }

    // 2. Fetch Project Charter & Scope Statement
    const { data: documents, error: docError } = await supabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .in('document_type', ['charter', 'scope_statement'])

    if (docError) {
      console.error('Fetch documents error:', docError)
      return { ok: false, error: 'Failed to fetch project documents.' }
    }

    const charter = documents?.find(d => d.document_type === 'charter')
    const scopeStatement = documents?.find(d => d.document_type === 'scope_statement')

    // 3. Fetch Product Backlog Items (PRD)
    const { data: backlogItems, error: backlogError } = await supabase
      .from('product_backlog_items')
      .select('title, description, acceptance_criteria, user_personas')
      .eq('project_id', projectId)

    if (backlogError) {
      console.error('Fetch backlog error:', backlogError)
    }

    // 4. Fetch existing stakeholders to avoid duplicates
    const { data: existingStakeholders, error: stakeholderError } = await supabase
      .from('stakeholders')
      .select('name, role_title')
      .eq('project_id', projectId)

    if (stakeholderError) {
      console.error('Fetch existing stakeholders error:', stakeholderError)
      return { ok: false, error: 'Failed to fetch existing stakeholders.' }
    }

    // Format Context for Prompt
    const charterContext = charter ? JSON.stringify(charter.free_text_content, null, 2) : 'No Project Charter found.'
    const scopeContext = scopeStatement ? JSON.stringify(scopeStatement.free_text_content, null, 2) : 'No Scope Statement found.'
    
    const backlogContext = backlogItems && backlogItems.length > 0 
      ? backlogItems.map(item => `Feature: ${item.title}\nPersonas: ${item.user_personas || 'N/A'}\nDescription: ${item.description || 'N/A'}`).join('\n\n')
      : 'No product backlog items found.'

    const existingStakeholderContext = existingStakeholders && existingStakeholders.length > 0
      ? existingStakeholders.map(s => `- ${s.name} (${s.role_title})`).join('\n')
      : 'None'

    // 5. Formulate Prompt
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    const systemPrompt = `You are an expert Project Management Praz-AI specializing in Stakeholder Management.
Your task is to analyze the Project Charter, Scope Statement, and Product Requirements (Backlog) to identify and generate a list of key stakeholders for the project.

Output a JSON object exactly matching this schema:
{
  "stakeholders": [
    {
      "name": "string (Name of the person, group, or persona)",
      "role_title": "string (Job title or project role)",
      "organization_type": "string (Must be exactly 'internal' or 'external')",
      "sub_category": "string (e.g., 'Sponsor', 'End User', 'Vendor', 'Regulatory')",
      "influence": "number (1-5 integer, 5 is highest influence)",
      "interest": "number (1-5 integer, 5 is highest interest)",
      "communication_preference": "string (e.g., 'Weekly Status Report', 'Daily Standup', 'Ad-hoc')",
      "rationale": "string (Brief explanation of why they are a stakeholder based on the context)"
    }
  ]
}

Guidelines:
- Analyze the Charter for Sponsors, Executives, and Clients.
- Analyze the Scope Statement for operational dependencies, departments, or specific teams.
- Analyze the Product Backlog for target users, personas, and cross-functional requirements.
- IMPORTANT: DO NOT include stakeholders that are already present in the "Existing Stakeholders" list. Only output NEW stakeholders you identify.
- If you can't find specific names, use generalized roles (e.g., 'VP of Marketing', 'Target Persona: Freelancer').`

    const userPrompt = `
      PROJECT CHARTER:
      ${charterContext}

      SCOPE STATEMENT:
      ${scopeContext}

      PRODUCT BACKLOG / PRD:
      ${backlogContext}

      EXISTING STAKEHOLDERS (Do NOT duplicate these):
      ${existingStakeholderContext}
      
      Generate a comprehensive list of NEW stakeholders based on the provided context.
    `

    const result = await generateStructuredJson<{ stakeholders: AiStakeholderSuggestion[] }>({
      systemPrompt,
      userPrompt
    })

    if (!result || !result.stakeholders || result.stakeholders.length === 0) {
      return { ok: false, error: 'Praz-AI failed to generate any new stakeholders.' }
    }

    // 6. Insert new stakeholders into the database
    const insertData = result.stakeholders.map(s => ({
      project_id: projectId,
      name: s.name,
      role_title: s.role_title,
      organization_type: s.organization_type === 'internal' || s.organization_type === 'external' ? s.organization_type : 'internal',
      sub_category: s.sub_category,
      influence: s.influence,
      interest: s.interest,
      communication_preference: s.communication_preference
    }))

    const { error: insertError } = await supabase
      .from('stakeholders')
      .insert(insertData)

    if (insertError) {
      console.error('Insert stakeholders error:', insertError)
      return { ok: false, error: 'Failed to save generated stakeholders to the database.' }
    }

    return { ok: true, data: result.stakeholders }
  } catch (err: any) {
    console.error('[generateStakeholdersFromContextAction Error]:', err)
    return { ok: false, error: err.message || 'Unknown error occurred during Praz-AI stakeholder generation.' }
  }
}

export async function generateFullStakeholderRegisterAction(
  organizationId: string,
  projectId: string,
  templateKeys: string[]
): Promise<{ ok: boolean; data?: Record<string, string>; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Verify Tier & Gating logic
    const sub = await getOrganizationSubscription(organizationId)
    const isEnterprise = sub.tierId === 'enterprise'
    const isPremium = sub.tierId === 'premium'

    if (!isEnterprise && !isPremium) {
      return { ok: false, error: 'Praz-AI Document Generation is only available on Premium and Enterprise plans.' }
    }

    if (isPremium) {
      const aiEnabled = await getOrganizationAiEnabled(organizationId)
      if (!aiEnabled) {
        return { ok: false, error: 'Praz-AI Features are currently disabled for this Premium workspace. Contact support to enable them.' }
      }
    }

    // 2. Fetch Project Charter & Scope Statement
    const { data: documents, error: docError } = await supabase
      .from('generated_documents')
      .select('document_type, free_text_content')
      .eq('project_id', projectId)
      .in('document_type', ['charter', 'scope_statement'])

    const charter = documents?.find(d => d.document_type === 'charter')
    const scopeStatement = documents?.find(d => d.document_type === 'scope_statement')

    // 3. Fetch Product Backlog Items (PRD)
    const { data: backlogItems } = await supabase
      .from('product_backlog_items')
      .select('title, description, acceptance_criteria, user_personas')
      .eq('project_id', projectId)

    // 3.5. Fetch existing stakeholders from DB
    const { data: existingStakeholders } = await supabase
      .from('stakeholders')
      .select('name, role_title, organization_type, sub_category, influence, interest, communication_preference')
      .eq('project_id', projectId)

    // Format Context for Prompt
    const charterContext = charter ? JSON.stringify(charter.free_text_content, null, 2) : 'No Project Charter found.'
    const scopeContext = scopeStatement ? JSON.stringify(scopeStatement.free_text_content, null, 2) : 'No Scope Statement found.'
    
    const backlogContext = backlogItems && backlogItems.length > 0 
      ? backlogItems.map(item => `Feature: ${item.title}\nPersonas: ${item.user_personas || 'N/A'}\nDescription: ${item.description || 'N/A'}`).join('\n\n')
      : 'No product backlog items found.'

    const stakeholdersContext = existingStakeholders && existingStakeholders.length > 0
      ? JSON.stringify(existingStakeholders, null, 2)
      : 'No stakeholders currently exist in the database.'

    // 4. Formulate Prompt
    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')
    
    const systemPrompt = `You are an expert Project Management Praz-AI specializing in Stakeholder Management.
Your task is to analyze the Project Charter, Scope Statement, Product Requirements (Backlog), and the CURRENT EXISTING STAKEHOLDERS to generate comprehensive content for the Stakeholder Register document.

Generate a JSON object with the following keys, containing detailed Markdown content for each section:
${templateKeys.filter(k => k !== 'stakeholder_register').map(k => `- "${k}": Markdown content for this section.`).join('\n')}

CRITICAL GUIDELINES:
1. ONLY reference or analyze stakeholders that are explicitly provided in the "EXISTING STAKEHOLDERS" context.
2. DO NOT hallucinate, invent, or create ANY new stakeholder names.
3. ABSOLUTELY DO NOT include "Praz-AI", yourself, or any AI entity as a stakeholder under any circumstances.
4. If the Existing Stakeholders list is empty, state that no stakeholders have been identified yet in your analysis.
5. Analyze how the existing stakeholders map to the Charter, Scope, and PRD.
6. Make the markdown detailed, professional, and well-structured using tables, lists, and headers where appropriate.`

    const userPrompt = `
      EXISTING STAKEHOLDERS (DO NOT INVENT ANY OUTSIDE THIS LIST):
      ${stakeholdersContext}

      PROJECT CHARTER:
      ${charterContext}

      SCOPE STATEMENT:
      ${scopeContext}

      PRODUCT BACKLOG / PRD:
      ${backlogContext}
      
      Generate the Stakeholder Register content using ONLY the existing stakeholders provided.
    `

    // Create a dynamic type schema definition string for the AI prompt
    type ExpectedResponse = Record<string, string>

    const result = await generateStructuredJson<ExpectedResponse>({
      systemPrompt,
      userPrompt
    })

    if (!result) {
      return { ok: false, error: 'Praz-AI failed to generate document content.' }
    }

    return { ok: true, data: result }
  } catch (err: any) {
    console.error('[generateFullStakeholderRegisterAction Error]:', err)
    return { ok: false, error: err.message || 'Unknown error occurred during Praz-AI document generation.' }
  }
}

