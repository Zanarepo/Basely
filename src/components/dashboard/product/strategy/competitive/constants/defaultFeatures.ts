import { CompetitorFeature, CompetitorPricingItem, CompetitorStrategyItem } from './types'

export const DEFAULT_COMPETITIVE_PRICING: CompetitorPricingItem[] = [
  {
    id: 'p1',
    dimensionName: 'Pricing Model',
    ourProduct: 'Seat-based Subscription',
    competitorA: 'Usage-based Tiered',
    competitorB: 'Flat-rate Enterprise',
  },
  {
    id: 'p2',
    dimensionName: 'Starting Price (Monthly)',
    ourProduct: '$49 / user',
    competitorA: '$99 base + usage',
    competitorB: 'Custom Quote Only',
  },
  {
    id: 'p3',
    dimensionName: 'Average ACV',
    ourProduct: '$12,000',
    competitorA: '$8,500',
    competitorB: '$45,000+',
  },
  {
    id: 'p4',
    dimensionName: 'Discounting Strategy',
    ourProduct: 'Volume-based (15% at 50+ seats)',
    competitorA: 'Aggressive 1st-year discounts',
    competitorB: 'Rigid, multi-year lock-ins',
  }
]

export const DEFAULT_COMPETITIVE_STRATEGY: CompetitorStrategyItem[] = [
  {
    id: 's1',
    dimensionName: 'Business Model',
    ourProduct: 'B2B SaaS',
    competitorA: 'B2B & B2C Freemium',
    competitorB: 'Enterprise On-Premise',
  },
  {
    id: 's2',
    dimensionName: 'Primary UVP',
    ourProduct: 'End-to-end integrated workflow for Product Teams',
    competitorA: 'Best-in-class specialized API platform',
    competitorB: 'Legacy enterprise standard for compliance',
  },
  {
    id: 's3',
    dimensionName: 'Target ICP Focus',
    ourProduct: 'Mid-market to Enterprise PMs and CPOs',
    competitorA: 'SMB Developers and Startups',
    competitorB: 'Fortune 500 Procurement Teams',
  },
  {
    id: 's4',
    dimensionName: 'Go-To-Market Motion',
    ourProduct: 'Product-Led Growth (PLG) + Inside Sales',
    competitorA: 'Developer-Led Marketing (Self-serve)',
    competitorB: 'Top-down Field Sales (Direct Outbound)',
  },
  {
    id: 's5',
    dimensionName: 'Estimated Market Share',
    ourProduct: '< 1% (New Entrant)',
    competitorA: '15% [Gartner](https://example.com)',
    competitorB: '40% [Forbes](https://example.com)',
  },
  {
    id: 's6',
    dimensionName: 'Annual Revenue (ARR)',
    ourProduct: '$0',
    competitorA: '$45M [TechCrunch](https://example.com)',
    competitorB: '$1.2B [Public Filings](https://example.com)',
  }
]

export const DEFAULT_COMPETITIVE_FEATURES: CompetitorFeature[] = [
  {
    id: 'f1',
    featureName: 'Real-Time Auto-Save & Collaboration',
    ourProduct: 'leading',
    competitorA: 'partial',
    competitorB: 'gap',
    notes: 'Our WebSocket architecture provides instant sync with zero data loss.',
  },
  {
    id: 'f2',
    featureName: 'Praz-AI Section Refinement & Copilot',
    ourProduct: 'moat',
    competitorA: 'gap',
    competitorB: 'partial',
    notes: 'Proprietary multi-model LLM router (Groq + Gemini + ChatGPT).',
  },
  {
    id: 'f3',
    featureName: 'PRD to RICE Backlog Automation',
    ourProduct: 'moat',
    competitorA: 'gap',
    competitorB: 'gap',
    notes: 'Automatically extracts user stories and inserts scored items into Supabase.',
  },
  {
    id: 'f4',
    featureName: 'Enterprise Governance & Approval Banners',
    ourProduct: 'leading',
    competitorA: 'partial',
    competitorB: 'gap',
    notes: 'Enforces sign-off workflows and audit telemetry logging.',
  },
]
