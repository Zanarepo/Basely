import { SlidersHorizontal, CheckCircle2, BarChart3 } from 'lucide-react'
import { DocumentItem } from '../types'

export const productPrioritizationExecutionDocs: DocumentItem[] = [
  {
    id: 'prioritization_workspace',
    title: 'RICE & Value Matrix',
    category: 'prioritization',
    suite: 'product',
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
  },
  {
    id: 'release_checklist_workspace',
    title: 'Release Launch Checklist',
    category: 'execution',
    suite: 'product',
    icon: CheckCircle2,
    description: 'Go-to-market readiness, QA sign-off, security audit & press.',
    badge: 'Launch',
    guide: {
      purpose: 'Ensures all cross-functional requirements (legal, QA, marketing) are met before public release.',
      audience: 'Release Managers, QA Leads, Product Marketing',
      bestPractices: [
        'Require mandatory QA and Security lead sign-offs.',
        'Conduct a staging dry-run 48 hours prior to launch.',
      ],
    },
  },
]
