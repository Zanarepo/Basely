import { BarChart3, SlidersHorizontal, CheckCircle2 } from 'lucide-react'
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

export const commonDocs = [statusReportDoc, riceMatrixDoc, qualityManagementPlanDoc]
