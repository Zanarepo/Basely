import { FileCheck, Lightbulb } from 'lucide-react'
import { DocumentItem } from '../types'

export const productRequirementsDocs: DocumentItem[] = [
  {
    id: 'product_requirements_document',
    title: 'Product Requirements Doc',
    category: 'requirements',
    suite: 'product',
    icon: FileCheck,
    description: 'Problem statements, user stories, acceptance criteria, & scope boundaries.',
    badge: 'PRD',
    guide: {
      purpose: 'Defines feature specs, problem statement, user stories, and acceptance criteria.',
      audience: 'Engineers, QA, UI/UX Designers, Product Managers',
      bestPractices: [
        'Define explicit Out-of-Scope boundaries to prevent scope creep.',
        'Ensure every User Story has testable Given-When-Then Acceptance Criteria.',
        'Link relevant North Star KPIs to quantify success.',
      ],
    },
  },
  {
    id: 'discovery_insights_document',
    title: 'Discovery Insights & VoC Evidence',
    category: 'requirements',
    suite: 'product',
    icon: Lightbulb,
    description: 'Voice of Customer (VoC) evidence, user pain points, interview insights & discovery findings.',
    badge: 'VoC',
    guide: {
      purpose: 'Aggregates qualitative user feedback, customer interview quotes, and Voice-of-Customer evidence to ground product requirements.',
      audience: 'Product Managers, UX Researchers, Executive Sponsors',
      bestPractices: [
        'Link real customer interview transcripts and quotes.',
        'Tag insights with severity/impact metrics.',
        'Map user evidence directly to feature requests.',
      ],
    },
  },
]
