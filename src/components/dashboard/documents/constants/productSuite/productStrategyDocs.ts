import { Target, Users, Compass, BarChart3 } from 'lucide-react'
import { DocumentItem } from '../types'

export const productStrategyDocs: DocumentItem[] = [
  {
    id: 'strategy_canvas_workspace',
    title: 'Strategy Canvas Studio',
    category: 'strategy',
    suite: 'product',
    icon: Target,
    description: 'Mission, vision, target market positioning, and core value proposition.',
    badge: 'Strategy',
    guide: {
      purpose: 'Aligns the product vision, market positioning, and unique value proposition across leadership.',
      audience: 'Execs, Investors, Product Managers',
      bestPractices: [
        'Review quarterly to ensure feature roadmaps stay aligned with company vision.',
        'Document core differentiators against key competitors.',
      ],
    },
  },
  {
    id: 'personas_workspace',
    title: 'Personas & JTBD Roster',
    category: 'strategy',
    suite: 'product',
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
  },
  {
    id: 'north_star_kpis_workspace',
    title: 'North Star KPI Engine',
    category: 'strategy',
    suite: 'product',
    icon: Compass,
    description: 'Key product metric definitions, target growth metrics, and telemetry.',
    badge: 'KPIs',
    guide: {
      purpose: 'Defines the single core metric that best captures the product value delivered to users.',
      audience: 'Leadership, Product Leads, Analysts',
      bestPractices: [
        'Ensure the North Star metric directly correlates with customer value.',
        'Break down into input metrics owned by individual squads.',
      ],
    },
  },
  {
    id: 'okrs_workspace',
    title: 'OKR Performance Tree',
    category: 'strategy',
    suite: 'product',
    icon: BarChart3,
    description: 'Objectives & Key Results hierarchy for product iterations and quarterly bets.',
    badge: 'OKRs',
    guide: {
      purpose: 'Connects high-level business goals to quantitative metrics for upcoming release cycles.',
      audience: 'Leadership, Product Leads, Development Teams',
      bestPractices: [
        'Limit to 3-5 Key Results per Objective for clarity.',
        'Ensure key results are measurable outcomes, not output task lists.',
      ],
    },
  },
  {
    id: 'roadmap_workspace',
    title: 'Release Roadmap Studio',
    category: 'strategy',
    suite: 'product',
    icon: Compass,
    description: 'Now-Next-Later theme roadmap and milestone releases schedule.',
    badge: 'Roadmap',
    guide: {
      purpose: 'Communicates strategic product direction and high-level launch timelines to stakeholders.',
      audience: 'Executive Board, Sales, Customer Success, PMO',
      bestPractices: [
        'Use outcome-focused themes rather than rigid date commitments.',
        'Keep the Now horizon detailed and the Later horizon flexible.',
      ],
    },
  },
  {
    id: 'product_strategy_document',
    title: 'Product Strategy Doc',
    category: 'strategy',
    suite: 'product',
    icon: Target,
    description: 'Master synthesis of vision, positioning, market analysis & OKRs.',
    badge: 'Strategy',
    guide: {
      purpose: 'Combines product vision, positioning, user personas, and target KPIs into one master document.',
      audience: 'Leadership, PMO, Product Teams',
      bestPractices: [
        'Keep strategic choices focused and explicit about what the product will NOT do.',
        'Update at the start of every fiscal year.',
      ],
    },
  },
  {
    id: 'competitive_analysis_workspace',
    title: 'Competitive Intelligence',
    category: 'strategy',
    suite: 'product',
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
  },
]
