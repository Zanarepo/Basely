import { CompetitorFeature } from './types'

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
