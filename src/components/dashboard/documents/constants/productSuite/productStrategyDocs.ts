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

]
