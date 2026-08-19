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
    id: 'strategic_outcomes_hub',
    title: 'Strategic Outcomes Hub',
    category: 'strategy',
    suite: 'product',
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
