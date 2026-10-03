'use client'

import React, { useState } from 'react'
import { Search, BookOpen, ChevronDown, ChevronRight, Settings, Layers, Calendar, AlertTriangle, Sparkles, Zap, Target, Users, LayoutDashboard, BrainCircuit, Lightbulb, CheckCircle2, Rocket, FileText, Clock, BarChart, Database, Network, Share2, Workflow, Globe, Shield, CreditCard, HelpCircle, ShieldCheck, GitBranch, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
import type { TierId } from '@/lib/organizations/tier-logic'


import { PredictivePlanningArticle } from './articles/PredictivePlanningArticle'
import { DynamicWorkloadArticle } from './articles/DynamicWorkloadArticle'
import { SkillGapArticle } from './articles/SkillGapArticle'
import { AdrWorkflowArticle } from './articles/AdrWorkflowArticle'

// Define the structure for a documentation entry
interface DocEntry {
  id: string
  title: string
  description: string
  keywords: string[]
  icon: React.ElementType
  content: (props: { onRequiresUpgrade: (feature: string, tier: TierId) => void }) => React.ReactNode
}

export function DocumentationCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  
  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('')
  
  const { activeWorkspace } = useWorkspace()
  const { tier, switchPlan } = useWorkspaceTier(activeWorkspace?.id)

  const handleRequiresUpgrade = (feature: string, requiredTier: TierId) => {
    setUpgradeFeature(feature)
    setUpgradeModalOpen(true)
  }

  // List of all documentation entries
  const docs: DocEntry[] = [
    {
      id: 'capacity-planning',
      title: 'Predictive Sprint & Capacity Planning',
      description: 'Learn how to set up the Capacity Matrix and use AI to prevent scheduling risks before they happen.',
      icon: BookOpen,
      keywords: ['capacity', 'matrix', 'sprint', 'planning', 'velocity', 'wbs', 'story points', 'estimation', 'risk'],
      content: ({ onRequiresUpgrade }) => <PredictivePlanningArticle onRequiresUpgrade={onRequiresUpgrade} />
    },
    {
      id: 'dynamic-workload-rebalancing',
      title: 'Dynamic Workload Rebalancing',
      description: 'Learn how to detect overloaded team members and reassign tasks intelligently.',
      icon: Sparkles,
      keywords: ['rebalance', 'workload', 'optimize', 'capacity', 'ai', 'sprint', 'iteration', 'skills'],
      content: ({ onRequiresUpgrade }) => <DynamicWorkloadArticle onRequiresUpgrade={onRequiresUpgrade} />
    },
    {
      id: 'skill-gap-analysis',
      title: 'AI Skill Gap Analysis',
      description: 'Proactively detect future skill bottlenecks in your Work Breakdown Structure.',
      icon: Sparkles,
      keywords: ['skills', 'gap', 'analysis', 'forward', 'planning', 'ai', 'capacity', 'matrix'],
      content: ({ onRequiresUpgrade }) => <SkillGapArticle onRequiresUpgrade={onRequiresUpgrade} />
    },
    {
      id: 'adr-workflow-integration',
      title: 'ADR Workflow Integration',
      description: 'How Architecture Decision Records connect to WBS, RAID, and Capacity Planning through AI.',
      icon: ShieldCheck,
      keywords: ['adr', 'architecture', 'decision', 'raid', 'compliance', 'skill gap', 'wbs', 'workflow', 'ai', 'integration'],
      content: ({ onRequiresUpgrade }) => <AdrWorkflowArticle onRequiresUpgrade={onRequiresUpgrade} />
    },
    // Future documentation entries can be added here
  ]

  // Filter docs based on search query
  const filteredDocs = docs.filter(doc => {
    if (!searchQuery) return true
    const lowerQuery = searchQuery.toLowerCase()
    return (
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.description.toLowerCase().includes(lowerQuery) ||
      doc.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
    )
  })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 h-full flex flex-col">
      {/* Header and Search */}
      <div className="mb-8 shrink-0">
        <h1 className="text-3xl font-bold text-app-fg flex items-center gap-3 mb-6">
          <BookOpen className="h-8 w-8 text-violet-500" />
          Documentation Center
        </h1>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-app-muted" />
          </div>
          <input
            type="text"
            className="w-full bg-app-card border border-app-border rounded-2xl pl-11 pr-4 py-4 text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all shadow-sm text-lg"
            placeholder="Search workflows, features, or how-tos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && (
          <p className="mt-3 text-sm text-app-muted">
            Found {filteredDocs.length} {filteredDocs.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Glossary / Accordion List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-12">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 bg-app-card border border-app-border rounded-2xl">
            <p className="text-app-muted text-lg">No documentation found matching your search.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-violet-500 font-semibold hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExpanded = expandedDoc === doc.id
            const Icon = doc.icon
            
            return (
              <div 
                key={doc.id} 
                className={`bg-app-card border ${isExpanded ? 'border-violet-500/50 shadow-md' : 'border-app-border shadow-sm hover:border-app-border-hover'} rounded-2xl transition-all duration-200 overflow-hidden`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                  className="w-full text-left px-6 py-5 flex items-start gap-4 focus:outline-none cursor-pointer"
                >
                  <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${isExpanded ? 'bg-violet-500/10 text-violet-500' : 'bg-app-surface text-app-muted'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h2 className="text-lg font-bold text-app-fg">{doc.title}</h2>
                    <p className="text-sm text-app-muted mt-1">{doc.description}</p>
                  </div>
                  <div className="shrink-0 mt-2">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-app-muted" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-app-muted" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-app-border/50 animate-in slide-in-from-top-2 duration-200">
                    {doc.content({ onRequiresUpgrade: handleRequiresUpgrade })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Embedded Upgrade Modal */}
      <UpgradePromptModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentTier={tier}
        organizationId={activeWorkspace?.id || ''}
        onSelectTier={async (t) => {
          if (switchPlan) await switchPlan(t)
          setUpgradeModalOpen(false)
        }}
        featureOrLimitName={upgradeFeature}
      />
    </div>
  )
}

