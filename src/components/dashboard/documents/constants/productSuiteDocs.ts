import { DocumentItem } from './types'
import { productStrategyDocs } from './productSuite/productStrategyDocs'
import { productRequirementsDocs } from './productSuite/productRequirementsDocs'
import { productPrioritizationExecutionDocs } from './productSuite/productPrioritizationExecutionDocs'
import { commonDocs } from './commonDocs'
import { Search, Map, Lightbulb, Users, Target, Activity, Star, Zap, FlaskConical, FileText, CheckCircle } from 'lucide-react'

// Step 1: Market Research
const marketResearchDoc: DocumentItem = {
  id: 'market_research_report',
  title: 'Master Market Research Spec',
  category: 'strategy',
  suite: 'product',
  icon: Search,
  description: 'TAM/SAM/SOM analysis, industry trends, and market positioning.',
  badge: 'Research',
  stepLabel: 'Step 1',
  guide: {
    purpose: 'Defines the total addressable market and key industry trends.',
    audience: 'Executive Board, Product Managers, Marketing',
    bestPractices: [
      'Focus on quantitative market data (TAM/SAM/SOM).',
      'Identify macroeconomic trends affecting the product.',
    ],
  },
}

// Step 2: Problem Discovery
const problemDiscoveryDoc: DocumentItem = {
  id: 'problem_discovery_workspace',
  title: 'Problem Discovery',
  category: 'strategy',
  suite: 'product',
  icon: Map,
  description: 'Identifying unserved needs, friction points, and root cause analysis.',
  badge: 'Discovery',
  stepLabel: 'Step 2',
  guide: {
    purpose: 'Formalize the pain points that need to be solved.',
    audience: 'Product Managers, UX Researchers',
    bestPractices: [
      'Use 5 Whys to get to the root cause.',
      'Separate the problem from the proposed solution.',
    ],
  },
}

// Step 3: Customer Research
const customerResearchDoc: DocumentItem = {
  id: 'customer_research_workspace',
  title: 'Customer Research Strategy',
  category: 'strategy',
  suite: 'product',
  icon: Search,
  description: 'Detailed 21-point Customer Research Strategy alongside VoC Evidence.',
  badge: 'Research',
  stepLabel: 'Step 3',
  guide: {
    purpose: 'Plan and synthesize qualitative and quantitative customer research.',
    audience: 'Product Managers, UX Researchers',
    bestPractices: [
      'Focus on behaviors over opinions.',
      'Always map pain points to root causes.',
    ],
  },
}

// Step 4: Problem Definition
const problemDefinitionDoc: DocumentItem = {
  id: 'problem_definition_workspace',
  title: 'Problem Definition',
  category: 'strategy',
  suite: 'product',
  icon: Users,
  description: 'Formal problem statements mapping the core issues to be solved.',
  badge: 'Discovery',
  stepLabel: 'Step 4',
  guide: {
    purpose: 'Crisply define who we are solving for and what the exact problem is.',
    audience: 'Product, Engineering, Design',
    bestPractices: [
      'Write problem statements in the format: [Persona] needs [Need] because [Insight].',
    ],
  },
}

const personasDoc = {
  ...commonDocs.find(d => d.id === 'personas_workspace')!,
  stepLabel: 'Step 4',
  title: 'Customer Personas & JTBD'
}

// Step 5: Product Strategy
const strategyCanvasDoc = {
  ...productStrategyDocs.find(d => d.id === 'strategy_canvas_workspace')!,
  stepLabel: 'Step 5',
}
const strategySpecDoc = {
  ...productStrategyDocs.find(d => d.id === 'product_strategy_document')!,
  stepLabel: 'Step 5',
}

const strategicOutcomesHubDoc = {
  ...commonDocs.find(d => d.id === 'strategic_outcomes_hub')!,
  stepLabel: 'Step 5',
}

// Step 6: Opportunity Assessment
const opportunityAssessmentDoc: DocumentItem = {
  id: 'opportunity_assessment_workspace',
  title: 'Opportunity Assessment',
  category: 'strategy',
  suite: 'product',
  icon: Activity,
  description: 'Evaluating potential business value, technical feasibility, and market risk.',
  badge: 'Strategy',
  stepLabel: 'Step 6',
  guide: {
    purpose: 'Assess whether a problem is worth solving for the business.',
    audience: 'Product Leaders, Tech Leads',
    bestPractices: [
      'Assess against company OKRs.',
      'Identify technical dealbreakers early.',
    ],
  },
}

// Step 7: Prioritization
const prioritizationDoc = {
  ...commonDocs.find(d => d.id === 'prioritization_workspace')!,
  stepLabel: 'Step 7',
  title: 'Opportunity Prioritization Matrix'
}

// Step 8: Solution Design
const solutionDesignDoc: DocumentItem = {
  id: 'solution_design_workspace',
  title: 'Solution Design & Wireframes',
  category: 'requirements',
  suite: 'product',
  icon: Zap,
  description: 'Ideation, user flows, architecture sketches, and UI wireframes.',
  badge: 'Design',
  stepLabel: 'Step 8',
  guide: {
    purpose: 'Brainstorm and sketch how to solve the prioritized opportunities.',
    audience: 'Designers, Tech Leads, Product Managers',
    bestPractices: [
      'Explore multiple solutions for the same problem.',
      'Map the happy path user flow first.',
    ],
  },
}

// Step 9: Validation
const validationDoc: DocumentItem = {
  id: 'solution_validation_workspace',
  title: 'Validation & Experiments',
  category: 'requirements',
  suite: 'product',
  icon: FlaskConical,
  description: 'Fake-door tests, A/B hypotheses, and prototype user testing results.',
  badge: 'Validation',
  stepLabel: 'Step 9',
  guide: {
    purpose: 'Validate the proposed solution with real users before writing code.',
    audience: 'UX Researchers, Product Managers',
    bestPractices: [
      'Define what success looks like before running the experiment.',
      'Test the riskiest assumptions first.',
    ],
  },
}

const qualityDoc = {
  ...commonDocs.find(d => d.id === 'quality_management_plan')!,
  stepLabel: 'Step 9',
}

// Step 10: Product Requirements
const prdDoc = {
  ...productRequirementsDocs.find(d => d.id === 'product_requirements_document')!,
  stepLabel: 'Step 10',
}

const releaseChecklistDoc = {
  ...productPrioritizationExecutionDocs.find(d => d.id === 'release_checklist_workspace')!,
  stepLabel: 'Step 10',
}

// Step 11: Roadmap Document
const roadmapWorkspaceDoc = {
  ...productStrategyDocs.find(d => d.id === 'roadmap_workspace')!,
  stepLabel: 'Step 11',
  title: 'Product Roadmap Document'
}

export const PRODUCT_SUITE_DOCS: DocumentItem[] = [
  marketResearchDoc,
  problemDiscoveryDoc,
  customerResearchDoc,
  problemDefinitionDoc,
  personasDoc,
  strategyCanvasDoc,
  strategySpecDoc,
  strategicOutcomesHubDoc,
  opportunityAssessmentDoc,
  prioritizationDoc,
  solutionDesignDoc,
  validationDoc,
  qualityDoc,
  prdDoc,
  releaseChecklistDoc,
  roadmapWorkspaceDoc
]
