import { BarChart3, SlidersHorizontal, CheckCircle2, Users, Compass } from 'lucide-react'
import { DocumentItem } from './types'

export const statusReportDoc: DocumentItem = {
  id: 'status_report',
  title: 'New Status Report',
  category: 'execution',
  suite: 'common',
  icon: BarChart3,
  description: 'Milestone progress, EVM metrics (CPI/SPI), budget variance & RAID log highlights.',
  badge: 'Execution',
  guide: {
    purpose: 'Provides leadership with a transparent update on schedule, budget, risks, and milestones.',
    audience: 'Steering Committee, Executives, PMO',
    bestPractices: [
      'Highlight Schedule Performance Index (SPI) and Cost Performance Index (CPI).',
      'Include top 3 open risks with mitigation plans.',
    ],
  },
}

export const riceMatrixDoc: DocumentItem = {
  id: 'prioritization_workspace',
  title: 'RICE & Value Matrix',
  category: 'prioritization',
  suite: 'common',
  icon: SlidersHorizontal,
  description: 'Scoring framework evaluating Reach, Impact, Confidence & Effort.',
  badge: 'Prioritization',
  guide: {
    purpose: 'Ranks feature ideas objectively based on return on investment and engineering effort.',
    audience: 'Product Managers, Engineering Leads',
    bestPractices: [
      'Standardize Confidence scores using real research data vs gut feeling.',
      'Re-evaluate Effort estimates with engineering leads before final scoring.',
    ],
  },
}

export const qualityManagementPlanDoc: DocumentItem = {
  id: 'quality_management_plan',
  title: 'Quality Management Plan',
  category: 'planning',
  suite: 'common',
  icon: CheckCircle2,
  description: 'Quality standards, QA/QC audit protocols, inspection checklists, and metrics.',
  badge: 'Planning',
  guide: {
    purpose: 'Ensures project/product deliverables meet defined quality standards and regulatory compliance.',
    audience: 'QA Leads, Inspectors, PMO, Product Teams',
    bestPractices: [
      'Define measurable Quality Metrics (e.g. defect rate < 1%).',
      'Schedule regular peer reviews and QA audits.',
    ],
  },
}

export const personasWorkspaceDoc: DocumentItem = {
  id: 'personas_workspace',
  title: 'Personas & JTBD Roster',
  category: 'strategy',
  suite: 'common',
  icon: Users,
  description: 'Target user archetypes, pain points, motivations & Jobs-to-be-Done.',
  badge: 'Research',
  guide: {
    purpose: 'Humanizes your target users so engineering and design build features tailored to real needs.',
    audience: 'UI/UX Designers, Product Managers, Engineers',
    bestPractices: [
      'Base personas on real customer interviews rather than assumptions.',
      'Highlight primary Jobs-to-be-Done (JTBD) for each persona.',
    ],
  },
}

export const strategicOutcomesHubDoc: DocumentItem = {
  id: 'strategic_outcomes_hub',
  title: 'Strategic Outcomes Hub',
  category: 'strategy',
  suite: 'common',
  icon: BarChart3,
  description: 'Unified dashboard for North Star metrics, OKRs, and Performance Reports.',
  badge: 'Goals & Outcomes',
  guide: {
    purpose: 'Connects high-level business goals to quantitative metrics and provides a single pane of glass for performance.',
    audience: 'Leadership, Product Leads, Development Teams',
    bestPractices: [
      'Ensure North Star metrics directly correlate with customer value.',
      'Review OKR progress and qualitative reports at the end of each iteration.',
    ],
  },
}

export const competitiveAnalysisWorkspaceDoc: DocumentItem = {
  id: 'competitive_analysis_workspace',
  title: 'Competitive Intelligence',
  category: 'strategy',
  suite: 'common',
  icon: Compass,
  description: 'Feature matrix, pricing tiers & market positioning vs key rivals.',
  badge: 'Analysis',
  guide: {
    purpose: 'Tracks competitor capabilities, market share, and feature parity.',
    audience: 'Product Management, Sales Enablement, Executive Leadership',
    bestPractices: [
      'Update quarterly based on competitor release notes.',
      'Highlight unfair advantages and unique moat features.',
    ],
  },
}

export const commonDocs = [
  statusReportDoc, 
  riceMatrixDoc, 
  qualityManagementPlanDoc,
  personasWorkspaceDoc,
  strategicOutcomesHubDoc,
  competitiveAnalysisWorkspaceDoc
]
