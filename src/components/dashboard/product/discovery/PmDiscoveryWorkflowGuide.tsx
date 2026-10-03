'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Inbox,
  Users,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  BookOpen,
} from 'lucide-react'

interface PmDiscoveryWorkflowGuideProps {
  currentStep?: 1 | 2 | 3 | 4
  onNavigateToStep?: (step: number) => void
}

export function PmDiscoveryWorkflowGuide({
  currentStep = 1,
  onNavigateToStep,
}: PmDiscoveryWorkflowGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeStep, setActiveStep] = useState<number>(currentStep)

  const steps = [
    {
      id: 1,
      badge: 'Step 1',
      title: 'VoC Discovery Inbox',
      icon: Inbox,
      color: 'from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/30',
      activeColor: 'bg-amber-500 text-white',
      tag: 'Customer Feedback & Research',
      story:
        'Log user interview notes, customer feedback, and feature requests. Tag each insight with a specific target Persona (e.g. "Dayo - Business Owner" or "Sarah - Site Supervisor").',
      keyAction: 'Auto-Sync to Persona',
      detail:
        'The moment feedback is logged and linked to a persona, it automatically appears inside that persona’s profile dashboard without manual copy-pasting.',
    },
    {
      id: 2,
      badge: 'Step 2',
      title: 'Personas & AI Insights',
      icon: Users,
      color: 'from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400 border-violet-500/30',
      activeColor: 'bg-violet-600 text-white',
      tag: 'AI Friction Enrichment & Backlog Gen',
      story:
        'View aggregated feedback per user persona. Use the AI Enrich Engine to analyze customer pain points, JTBD (Jobs-To-Be-Done), and strategic opportunities.',
      keyAction: 'AI Backlog Generation',
      detail:
        'Enterprise PMs click "Generate Backlog" to let AI synthesize enriched insights into formal Epics, automatically sending them to the RICE Prioritization Matrix.',
    },
    {
      id: 3,
      badge: 'Step 3',
      title: 'RICE Prioritization Matrix',
      icon: SlidersHorizontal,
      color: 'from-indigo-500/20 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      activeColor: 'bg-indigo-600 text-white',
      tag: 'ROI Scoring & Backlog Ranking',
      story:
        'The AI-generated Epics land in the RICE Matrix with initial Reach, Impact, Confidence, and Effort scores. PMs review, adjust MoSCoW priorities, and finalize rankings.',
      keyAction: 'Send to Execution (WBS)',
      detail:
        'Once prioritized, PMs click "Send to Execution" to push approved Epics directly into the WBS & Agile Roadmap.',
    },
    {
      id: 4,
      badge: 'Step 4',
      title: 'WBS & Agile Roadmap',
      icon: Layers,
      color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      activeColor: 'bg-emerald-600 text-white',
      tag: 'Decomposed Stories, AC & Dependencies',
      story:
        'Epics land in the WBS as top-level Work Packages. The system automatically breaks them down into sub-level User Stories complete with Acceptance Criteria and Dependencies.',
      keyAction: 'Execution Ready',
      detail:
        'Includes Given-When-Then Acceptance Criteria (AC), risk flags, edge cases, and cross-task dependencies pre-mapped for engineering squads.',
    },
  ]

  const currentStepData = steps.find((s) => s.id === activeStep) || steps[0]

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-emerald-500/10 border border-violet-500/20 space-y-4 shadow-sm">
      {/* Drawer Header Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-violet-600 text-white shadow-md">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-app-fg tracking-tight">
                Product Discovery & Delivery Pipeline
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[10px] font-extrabold uppercase tracking-wider">
                End-to-End Workflow Guide
              </span>
            </div>
            <p className="text-xs text-app-muted mt-0.5">
              How VoC Feedback → Personas → RICE Prioritization → WBS Roadmap work together.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-xl bg-app-surface border border-app-border text-xs font-bold text-app-fg hover:bg-app-hover transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5 text-violet-500" />
          <span>{isExpanded ? 'Hide Workflow' : 'Show Workflow Guide'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* STEPPER NAV BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {steps.map((step) => {
              const IconComp = step.icon
              const isActive = activeStep === step.id

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    setActiveStep(step.id)
                    if (onNavigateToStep) onNavigateToStep(step.id)
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    isActive
                      ? `bg-gradient-to-br ${step.color} shadow-md border-violet-500/50 ring-2 ring-violet-500/20`
                      : 'bg-app-surface/60 border-app-border hover:bg-app-surface hover:border-app-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                        isActive ? step.activeColor : 'bg-app-muted-surface text-app-muted'
                      }`}
                    >
                      {step.id}
                    </span>
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-violet-500' : 'text-app-subtle'}`} />
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-app-subtle">
                      {step.badge}
                    </div>
                    <div className="text-xs font-extrabold text-app-fg truncate mt-0.5">
                      {step.title}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ACTIVE STEP STORY DETAIL CARD */}
          <div className="p-5 rounded-2xl bg-app-surface border border-app-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-app-border">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                  {React.createElement(currentStepData.icon, { className: 'w-4 h-4' })}
                </span>
                <div>
                  <h4 className="text-sm font-black text-app-fg">
                    {currentStepData.title}: <span className="text-violet-500">{currentStepData.tag}</span>
                  </h4>
                  <p className="text-xs text-app-muted mt-0.5">{currentStepData.story}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300 text-xs font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Key Action: {currentStepData.keyAction}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-app-bg border border-app-border space-y-1.5">
                <div className="font-extrabold text-app-fg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span>How Data Flows to Next Stage</span>
                </div>
                <p className="text-app-muted leading-relaxed">{currentStepData.detail}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-1.5">
                <div className="font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Product Manager Best Practice</span>
                </div>
                <p className="text-app-fg leading-relaxed">
                  {activeStep === 1 &&
                    'Always tag insights with a target persona to eliminate isolated feedback silos.'}
                  {activeStep === 2 &&
                    'Use AI enrichment to convert raw customer complaints into structured JTBD statements.'}
                  {activeStep === 3 &&
                    'Recalibrate RICE confidence scores after user interviews before locking sprint commitments.'}
                  {activeStep === 4 &&
                    'Verify Given-When-Then Acceptance Criteria and edge cases are assigned before team handover.'}
                </p>
              </div>
            </div>

            {/* Stepper Navigation Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                disabled={activeStep === 1}
                className="px-3 py-1.5 rounded-xl bg-app-bg border border-app-border text-xs font-bold text-app-fg hover:bg-app-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                ← Previous Stage
              </button>

              <div className="flex items-center gap-2">
                {activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.min(4, prev + 1))}
                    className="px-4 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-md hover:bg-violet-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next Stage: Step {activeStep + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-extrabold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pipeline Ready for Delivery!</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
