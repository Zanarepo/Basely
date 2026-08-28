'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Search,
  Compass,
  Map,
  FileText,
  ListChecks,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  BookOpen,
  Target,
} from 'lucide-react'

interface AiAutomationWorkflowGuideProps {
  currentStep?: 1 | 2 | 3 | 4 | 5 | 6
  onNavigateToStep?: (step: number) => void
}

export function AiAutomationWorkflowGuide({
  currentStep = 1,
  onNavigateToStep,
}: AiAutomationWorkflowGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeStep, setActiveStep] = useState<number>(currentStep)

  const steps = [
    {
      id: 1,
      badge: 'Step 1',
      title: 'Market Research',
      icon: Search,
      color: 'from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/30',
      activeColor: 'bg-amber-500 text-white',
      tag: 'TAM, Competitors, ICP Discovery',
      story:
        'Document your addressable market size, target customer profiles, competitive landscape, and user friction points.',
      keyAction: 'Synthesize Strategy',
      detail:
        'Feeds directly into the AI Strategy engine to ground all auto-generated product decisions in verified market reality.',
    },
    {
      id: 2,
      badge: 'Step 2',
      title: 'AI Product Strategy',
      icon: Compass,
      color: 'from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400 border-violet-500/30',
      activeColor: 'bg-violet-600 text-white',
      tag: 'Vision, Pillars, Differentiation',
      story:
        '1-click generation of your comprehensive 28-section strategic document based entirely on your market research inputs.',
      keyAction: 'Generate Roadmap',
      detail:
        'Transforms qualitative research into formal strategic pillars, bets, and defensibility moats without manual drafting.',
    },
    {
      id: 3,
      badge: 'Step 3',
      title: 'Strategic Outcomes & OKRs',
      icon: Target,
      color: 'from-pink-500/20 to-pink-500/5 text-pink-600 dark:text-pink-400 border-pink-500/30',
      activeColor: 'bg-pink-600 text-white',
      tag: 'Objectives & North Star',
      story:
        'AI analyzes the product strategy to auto-generate quantitative North Star metrics and strict, measurable OKRs.',
      keyAction: 'Generate OKRs',
      detail:
        'Forms the quantitative backbone of your product, allowing the upcoming roadmap to be automatically aligned with strategic goals.',
    },
    {
      id: 4,
      badge: 'Step 4',
      title: 'AI Product Roadmap',
      icon: Map,
      color: 'from-indigo-500/20 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      activeColor: 'bg-indigo-600 text-white',
      tag: 'Now / Next / Later Sequencing',
      story:
        'Auto-converts strategy into a Now/Next/Later timeline, aligning items automatically to the generated OKRs.',
      keyAction: 'Generate PRD',
      detail:
        'Aligns engineering and leadership on feature sequencing, dependencies, and expected outcomes across quarters.',
    },
    {
      id: 5,
      badge: 'Step 5',
      title: 'AI PRD Specs',
      icon: FileText,
      color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      activeColor: 'bg-emerald-600 text-white',
      tag: '23-Section Requirements Spec',
      story:
        'Auto-expands roadmap initiatives into Agile User Stories, functional requirements, UI/UX guidelines, and Edge Cases.',
      keyAction: 'Extract Backlog',
      detail:
        'The AI builds a complete PRD in seconds, allowing PMs to simply review and refine rather than write specs from scratch.',
    },
    {
      id: 6,
      badge: 'Step 6',
      title: 'RICE Backlog Extraction',
      icon: ListChecks,
      color: 'from-cyan-500/20 to-cyan-500/5 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      activeColor: 'bg-cyan-600 text-white',
      tag: 'Sprint Execution Items',
      story:
        'Uses the PRD → RICE module to automatically extract user stories and populate your development sprint backlog.',
      keyAction: 'Start Sprints',
      detail:
        'Extracted stories are assigned estimated Reach, Impact, Confidence, and Effort scores to immediately prioritize engineering work.',
    },
  ]

  const currentStepData = steps.find((s) => s.id === activeStep) || steps[0]

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-indigo-500/10 border border-violet-500/20 space-y-4 shadow-sm">
      {/* Drawer Header Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-app-fg tracking-tight">
                AI Product Synthesis Chain
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                Praz-AI Workflow
              </span>
            </div>
            <p className="text-xs text-app-muted mt-0.5">
              How Market Research seamlessly automates Strategy, Roadmaps, PRDs, and the Sprint Backlog.
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                    'Validate your ICP and TAM estimates thoroughly; poor market inputs lead to weak downstream strategies.'}
                  {activeStep === 2 &&
                    'Treat AI-generated strategy as a strong draft. Edit the defensive moats and pillars to match your specific context.'}
                  {activeStep === 3 &&
                    'Review the AI-generated OKRs with stakeholders. They form the bridge between your high-level strategy and roadmap execution.'}
                  {activeStep === 4 &&
                    'Ensure the "Now" horizon strictly focuses on high-confidence bets that address immediate market needs and align to your OKRs.'}
                  {activeStep === 5 &&
                    'Before finalizing the PRD, review the AI-generated edge cases to see if any complex scenarios were missed.'}
                  {activeStep === 6 &&
                    'Always manually review the AI-estimated RICE scores with your engineering lead before starting the sprint.'}
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
                {activeStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.min(6, prev + 1))}
                    className="px-4 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-md hover:bg-violet-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next Stage: Step {activeStep + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-extrabold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Backlog Ready for Engineering!</span>
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
