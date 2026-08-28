const fs = require('fs');
const file = 'src/lib/documents/ai-chain-actions.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { STATIC_TEMPLATES }')) {
  content = content.replace("import { getSyncDocumentTemplate } from './prd-templates'", "import { getSyncDocumentTemplate } from './prd-templates'\nimport { STATIC_TEMPLATES } from './static-templates'");
}

const newFunctions = `

// ==========================================
// 12-STEP AI AUTOMATION CHAIN PIPELINE
// ==========================================

export async function chainDocumentGeneration(
  projectId: string,
  targetDocumentType: string,
  upstreamDocumentType: string,
  personaRole: string,
  actionInstruction: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    // 1. Fetch Upstream Document
    const { data: upstreamDoc, error: upErr } = await adminSupabase
      .from('generated_documents')
      .select('free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', upstreamDocumentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    if (upErr || !upstreamDoc || !upstreamDoc.free_text_content) {
      return { ok: false, error: \`Required upstream document (\${upstreamDocumentType}) is missing or empty. Please generate it first.\` }
    }

    // 2. Format Upstream Context
    const upstreamText = Object.entries(upstreamDoc.free_text_content as Record<string, string>)
      .filter(([k]) => !k.startsWith('__'))
      .map(([k, v]) => \`[\${k.toUpperCase()}]\\n\${v}\`)
      .join('\\n\\n')
      
    const rawContext = \`
[UPSTREAM CONTEXT: \${upstreamDocumentType.toUpperCase()}]
\${upstreamText}
\`

    // 3. Construct JSON Schema from Target Template
    const template = STATIC_TEMPLATES[targetDocumentType]
    if (!template) {
       return { ok: false, error: \`Target template \${targetDocumentType} not found in STATIC_TEMPLATES.\` }
    }
    
    let schemaObj: Record<string, string> = {}
    for (const section of template.section_definitions) {
       schemaObj[section.key] = \`Markdown string for: \${section.title}\`
    }
    
    const schemaString = JSON.stringify(schemaObj, null, 2)

    // 4. Construct Prompt
    const systemPrompt = \`You are Praz-AI, a \${personaRole}. \${actionInstruction}
Format your output as a JSON object with ALL of the following exact keys. Each value must be a rich markdown string:
\${schemaString}
CRITICAL: Return ONLY strictly valid JSON. You MUST escape all newlines inside string values as \\\\\\\\n. Do not use literal multiline strings. Do not output any markdown formatting outside the JSON object.\`

    const parsedResult = await generateStructuredJson<Record<string, string>>({
      systemPrompt,
      userPrompt: rawContext,
    })

    const freeTextPayload: Record<string, string> = {
      ...parsedResult,
    }

    return { ok: true, data: freeTextPayload }

  } catch (err: any) {
    console.error(\`[chainDocumentGeneration Error for \${targetDocumentType}]:\`, err)
    return { ok: false, error: err.message || 'Failed to generate document' }
  }
}

export async function draftProblemDiscoveryFromMarketResearch(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'problem_discovery_workspace', 
    'market_research_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Market Research into a Problem Discovery framework.'
  )
}

export async function draftCustomerResearchFromProblemDiscovery(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'customer_research_strategy', 
    'problem_discovery_workspace',
    'Senior User Researcher',
    'Synthesize the upstream Problem Discovery into a Customer Research Strategy.'
  )
}

export async function draftProblemDefinitionFromCustomerResearch(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'problem_definition_workspace', 
    'customer_research_strategy',
    'Senior Product Manager',
    'Synthesize the upstream Customer Research into a crisp Problem Definition.'
  )
}

export async function draftProductStrategyFromProblemDefinition(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'product_strategy_workspace', 
    'problem_definition_workspace',
    'VP of Product',
    'Synthesize the upstream Problem Definition into a comprehensive Product Strategy.'
  )
}

export async function draftOpportunityAssessmentFromStrategy(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'opportunity_assessment_workspace', 
    'product_strategy_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Product Strategy into a tactical Opportunity Assessment.'
  )
}

export async function draftPrioritizationFromOpportunities(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'prioritization_workspace', 
    'opportunity_assessment_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Opportunity Assessment into a RICE Prioritization matrix.'
  )
}

export async function draftSolutionDesignFromPrioritization(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'solution_design_workspace', 
    'prioritization_workspace',
    'Senior Product Designer',
    'Synthesize the upstream context into a Product Discovery & Solution Design document.'
  )
}

export async function draftValidationFromSolutionDesign(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'solution_validation_workspace', 
    'solution_design_workspace',
    'Senior Product Manager',
    'Synthesize the upstream Solution Design into an Experimentation & Validation plan.'
  )
}

export async function draftPrdFromValidation(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'product_requirements_document', 
    'solution_validation_workspace',
    'Technical Product Manager',
    'Synthesize the upstream Validation plan into a comprehensive Product Requirements Document (PRD).'
  )
}

export async function draftRoadmapFromPrd(projectId: string) {
  return chainDocumentGeneration(
    projectId, 
    'product_roadmap_document', 
    'product_requirements_document',
    'VP of Product',
    'Synthesize the upstream PRD into a Now/Next/Later Product Roadmap.'
  )
}
`;

if (!content.includes('draftProblemDiscoveryFromMarketResearch')) {
  content += newFunctions;
  fs.writeFileSync(file, content);
  console.log('Appended 12-step chain functions successfully.');
} else {
  console.log('Functions already exist.');
}
