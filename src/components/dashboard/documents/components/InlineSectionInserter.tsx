import React, { useState, useRef, useEffect } from 'react'
import { Plus, Check, X, Loader2, Sparkles } from 'lucide-react'

export interface SectionPreset {
  icon: string
  title: string
  content: string
}

export const SECTION_PRESETS: SectionPreset[] = [
  {
    icon: '🔒',
    title: 'Security & Compliance',
    content: `## Security & Data Privacy Requirements\n\n- **Data Encryption**: All data must be encrypted using AES-256 at rest and TLS 1.3 in transit.\n- **Authentication**: Mandatory Multi-Factor Authentication (MFA) and RBAC role checks.\n- **Compliance Standards**: SOC2 Type II, GDPR, and ISO/IEC 27001 compliance.\n`
  },
  {
    icon: '🎯',
    title: 'KPIs & Target Metrics',
    content: `| Metric | Current Baseline | Target Objective | Measurement Window |\n| --- | --- | --- | --- |\n| API P99 Latency | 350ms | < 120ms | Monthly |\n| System Uptime SLA | 99.5% | 99.99% | Quarterly |\n| User Onboarding Completion | 42% | > 75% | Bi-Weekly |\n`
  },
  {
    icon: '🚀',
    title: 'Go-To-Market Plan',
    content: `### GTM Milestones & Rollout Schedule\n\n1. **Internal Beta**: QA & Team Dogfooding (Weeks 1-2)\n2. **Private Alpha**: Top 20 Enterprise Partners (Weeks 3-4)\n3. **Public Launch**: Product Hunt & Press Release (Week 6)\n\n> **Key Goal**: 1,000 active workspace signups within 30 days of release.\n`
  },
  {
    icon: '💰',
    title: 'Pricing & SLA Matrix',
    content: `| Tier | Monthly Price | Included Features | Support SLA |\n| --- | --- | --- | --- |\n| Starter | Free | Up to 3 Projects, Basic Analytics | 48-Hour Email |\n| Professional | $29 / user | Unlimited Projects, AI Copilot, Export | 12-Hour Priority |\n| Enterprise | Custom | Dedicated Instance, Custom Integrations | 1-Hour SLA & Phone |\n`
  },
  {
    icon: '⚠️',
    title: 'Risk & Mitigation',
    content: `- **Risk**: Database Latency Spike under High Peak Load\n  - *Impact*: High | *Likelihood*: Medium\n  - *Mitigation*: Implement Redis caching layer & read-replicas\n\n- **Risk**: Third-Party API Outage\n  - *Impact*: Medium | *Likelihood*: Low\n  - *Mitigation*: Fallback offline queue with automatic retries\n`
  },
  {
    icon: '🏗️',
    title: 'System Architecture',
    content: `### Technical Stack & Infrastructure\n\n- **Frontend**: Next.js 14 App Router (TypeScript, TailwindCSS)\n- **Backend**: PostgreSQL (Supabase RLS), Redis Cache\n- **Authentication**: OAuth 2.0 / OpenID Connect + JWT Tokens\n- **Edge Network**: Global CDN Deployment with Sub-100ms POP Latency\n`
  }
]

interface InlineSectionInserterProps {
  onAddSection: (title: string, initialContent?: string) => void
  isPending?: boolean
}

export default function InlineSectionInserter({
  onAddSection,
  isPending = false
}: InlineSectionInserterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleSubmit = async (customTitle?: string, initialContent?: string) => {
    const finalTitle = (customTitle || title).trim()
    if (!finalTitle || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Paced loading feedback
      await new Promise((res) => setTimeout(res, 400))
      await onAddSection(finalTitle, initialContent)
      setTitle('')
      setIsOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative my-3 group/inserter z-10 transition-all">
      {!isOpen ? (
        <div className="flex items-center justify-center relative py-1">
          {/* Subtle line on hover */}
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-transparent group-hover/inserter:border-violet-500/40 border-dashed transition-all duration-200" />
          </div>

          {/* Plus Add Section Button on hover */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{ cursor: 'pointer' }}
            className="relative z-10 opacity-0 group-hover/inserter:opacity-100 scale-95 group-hover/inserter:scale-100 transition-all duration-200 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-400 bg-app-surface border border-violet-500/30 rounded-full shadow-md hover:bg-violet-600 hover:text-white hover:border-violet-600 cursor-pointer"
            title="Add a new custom section here"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section Here</span>
          </button>
        </div>
      ) : (
        <div className="p-4 bg-app-surface border-2 border-violet-500/40 rounded-xl shadow-lg space-y-3.5 animate-fade-in my-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Insert New Custom Section
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets Ribbon */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-500" /> 1-Click Executive Presets:
            </span>
            <div className="flex items-center flex-wrap gap-1.5">
              {SECTION_PRESETS.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(preset.title, preset.content)}
                  style={{ cursor: 'pointer' }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Section Title Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-app-border/60"
          >
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false)
              }}
              disabled={isSubmitting}
              placeholder="Or type custom title (e.g. Regional Risk Assessment, SLA Requirements)..."
              className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-app-border bg-app-bg text-app-fg placeholder:text-app-muted focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all font-medium disabled:opacity-60"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={!title.trim() || isPending || isSubmitting}
                style={{ cursor: 'pointer' }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSubmitting || isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Insert Section
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs font-semibold text-app-muted hover:text-app-fg bg-app-muted-surface rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
