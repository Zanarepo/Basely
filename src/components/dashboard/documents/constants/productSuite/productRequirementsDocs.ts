import { Users, FileCheck, Lightbulb } from 'lucide-react'
import { DocumentItem } from '../types'

export const productRequirementsDocs: DocumentItem[] = [
  {
    id: 'user_journey_workspace',
    title: 'User Journey Map',
    category: 'requirements',
    suite: 'product',
    icon: Users,
    description: 'End-to-end user touchpoints, emotional curve & drop-off friction.',
    badge: 'UX Map',
    guide: {
      purpose: 'Visualizes the step-by-step experience of a user achieving a goal within your product.',
      audience: 'UX Designers, Product Managers, Customer Support Leads',
      bestPractices: [
        'Identify key friction points where users drop off.',
        'Map emotion levels across onboarding and core tasks.',
      ],
    },
  },
  {
    id: 'feature_backlog_workspace',
    title: 'Feature Backlog Roster',
    category: 'requirements',
    suite: 'product',
    icon: FileCheck,
    description: 'Centralized feature requests, user stories, acceptance criteria.',
    badge: 'Backlog',
    guide: {
      purpose: 'Consolidates all feature requests, ideas, and backlog items in one place.',
      audience: 'Product Owners, Scrum Masters, Engineering Teams',
      bestPractices: [
        'Groom weekly to remove stale or duplicate requests.',
        'Ensure items are tagged with clear priority badges.',
      ],
    },
  },
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
