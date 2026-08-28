'use client'

import React, { useState } from 'react'
import { Search, BookOpen, ChevronDown, ChevronRight, Settings, Layers, Calendar, AlertTriangle, Sparkles, Zap, Target, Users, LayoutDashboard, BrainCircuit, Lightbulb, CheckCircle2, Rocket, FileText, Clock, BarChart, Database, Network, Share2, Workflow, Globe, Shield, CreditCard, HelpCircle, ShieldCheck, GitBranch, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
import type { TierId } from '@/lib/organizations/tier-logic'

// Define the structure for a documentation entry
interface DocEntry {
  id: string
  title: string
  description: string
  keywords: string[]
  icon: React.ElementType
  content: (props: { onRequiresUpgrade: (feature: string, tier: TierId) => void }) => React.ReactNode
}

// A smart link that checks tier requirements before navigating
const DocLink = ({ 
  href, 
  children, 
  requiredTier, 
  featureName,
  onRequiresUpgrade 
}: { 
  href: string
  children: React.ReactNode
  requiredTier?: TierId
  featureName?: string
  onRequiresUpgrade?: (feature: string, tier: TierId) => void
}) => {
  const router = useRouter()
  const { activeWorkspace } = useWorkspace()
  const { tier } = useWorkspaceTier(activeWorkspace?.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (requiredTier && onRequiresUpgrade) {
      const tiers = { free: 0, premium: 1, enterprise: 2 }
      const currentTierLevel = tiers[(tier as TierId) || 'free'] || 0
      const requiredTierLevel = tiers[requiredTier] || 0
      
      if (currentTierLevel < requiredTierLevel) {
        onRequiresUpgrade(featureName || 'This feature', requiredTier)
        return
      }
    }
    
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} className="text-violet-500 hover:underline cursor-pointer font-medium">
      {children}
    </a>
  )
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
      keywords: ['capacity', 'matrix', 'sprint', 'planning', 'velocity', 'wbs', 'story points', 'estimation', 'risk'],
      icon: BookOpen,
      content: ({ onRequiresUpgrade }) => (
        <div className="space-y-8 py-4">
          {/* Section 1 */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-500" />
              1. Setting up the Capacity Matrix
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                The <strong>Capacity Matrix</strong> is the foundation of predictive scheduling. It defines how much work your team can realistically complete within a single iteration (Sprint or Phase).
              </p>
              <div className="bg-app-surface/50 border border-app-border rounded-xl p-4">
                <h4 className="font-semibold text-app-fg mb-2">How to set it up:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Navigate to <DocLink href="/dashboard" onRequiresUpgrade={onRequiresUpgrade}>your project</DocLink> from the dashboard.</li>
                  <li>Go to the <strong>Project Charter</strong> or <strong>Project Settings</strong> tab.</li>
                  <li>Locate the <strong>Capacity Matrix & Timeline Settings</strong> section.</li>
                  <li>Set the <strong>Target Sprint Velocity</strong>: This is the maximum number of Story Points your team aims to complete per sprint.</li>
                  <li>Set the <strong>Available Weekly Hours</strong> (optional): For context on team availability.</li>
                  <li>Save the project details.</li>
                </ol>
              </div>
              <p className="text-xs">
                <em>Note: The Target Sprint Velocity acts as a soft limit. It won't stop you from planning, but it powers the AI Capacity Risk detection.</em>
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              2. Estimating Work in the WBS
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Before you can schedule work, the tasks need to be sized. In the <DocLink href="/dashboard" onRequiresUpgrade={onRequiresUpgrade}>Intelligence Hub (WBS Workspace)</DocLink>, you break down your project into manageable elements.
              </p>
              <div className="bg-app-surface/50 border border-app-border rounded-xl p-4">
                <h4 className="font-semibold text-app-fg mb-2">Assigning Story Points:</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Manual Entry:</strong> Open any WBS Element and manually type a number into the <em>Story Points</em> field.</li>
                  <li><strong>AI Estimation:</strong> Click the <em>✨ Estimate</em> button next to the Story Points field. The AI will analyze the element to suggest a realistic point value. <DocLink href="/dashboard" requiredTier="premium" featureName="AI Estimation" onRequiresUpgrade={onRequiresUpgrade}>(Requires Premium)</DocLink></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              3. Iteration Planning & AI Risk Detection
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Once your Capacity Matrix is set and your WBS elements are estimated, you are ready to plan your Sprints or Phases in the <DocLink href="/dashboard" onRequiresUpgrade={onRequiresUpgrade}>Releases Workspace</DocLink>.
              </p>
              <div className="bg-app-surface/50 border border-app-border rounded-xl p-4">
                <h4 className="font-semibold text-app-fg mb-2">The Planning Flow:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to the <strong>Releases & Iterations</strong> workspace inside your project.</li>
                  <li>Click <strong>New Sprint</strong> (or New Phase).</li>
                  <li>In the modal, scroll down to the <strong>Tag Scope Deliverables</strong> checklist.</li>
                  <li>Select the WBS elements you want to include in this iteration.</li>
                </ol>
              </div>
              
              <div className="mt-4 flex items-start gap-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400">Capacity Risk Detected</h4>
                  <p className="text-sm text-rose-600 dark:text-rose-300 mt-1">
                    As you select items, the AI automatically tallies the total <em>Story Points</em>. It compares this total against the <em>Target Sprint Velocity</em>. If the total points exceed your team's capacity, an immediate warning is flagged.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'dynamic-workload-rebalancing',
      title: 'Dynamic Workload Rebalancing',
      description: 'Learn how to detect overloaded team members and reassign tasks intelligently.',
      icon: Sparkles,
      keywords: ['rebalance', 'workload', 'optimize', 'capacity', 'ai', 'sprint', 'iteration', 'skills'],
      content: ({ onRequiresUpgrade }) => (
        <div className="space-y-6 animate-in fade-in duration-300 pb-4">
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              1. Identifying Overloaded Members
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Project execution is messy. If a team member falls behind, their assigned <em>Story Points</em> for the Sprint might exceed their available capacity (Sprint Velocity).
              </p>
              <p>
                When editing an Iteration, the <DocLink href="/dashboard" onRequiresUpgrade={onRequiresUpgrade}>Releases Workspace</DocLink> allows you to analyze workloads automatically.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              2. Optimizing Workload with AI
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Click the <strong>✨ Optimize Workload</strong> button inside the Iteration modal to trigger the AI Rebalancer.
              </p>
              <div className="bg-app-surface/50 border border-app-border rounded-xl p-4">
                <h4 className="font-semibold text-app-fg mb-2">How it works:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>The AI identifies members whose assigned tasks exceed their capacity.</li>
                  <li>It infers the required technical skills for those tasks.</li>
                  <li>It scans the <DocLink href="/dashboard" onRequiresUpgrade={onRequiresUpgrade}>Team Competency & Capacity Matrix</DocLink> for other members with matching skills and spare bandwidth.</li>
                  <li>It suggests reassignments (e.g., "Alex is overloaded. Elena has the required React skills and spare capacity. Move task to Elena?").</li>
                </ol>
              </div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'skill-gap-analysis',
      title: 'AI Skill Gap Analysis',
      description: 'Proactively detect future skill bottlenecks in your Work Breakdown Structure.',
      icon: Sparkles,
      keywords: ['skills', 'gap', 'analysis', 'forward', 'planning', 'ai', 'capacity', 'matrix'],
      content: ({ onRequiresUpgrade }) => (
        <div className="space-y-6 animate-in fade-in duration-300 pb-4">
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              1. What is Skill Gap Analysis?
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Instead of realizing you are missing a critical team member right when a new project phase begins, the AI looks ahead into your <DocLink href="/dashboard" onRequiresUpgrade={onRequiresUpgrade}>Work Breakdown Structure (WBS)</DocLink> to predict upcoming bottlenecks.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              2. How It Works
            </h3>
            <div className="space-y-3 text-app-muted">
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong>Defining Requirements:</strong> When planning a future WBS phase, define the required skills (e.g., <code>frontend</code>, <code>data_science</code>).
                </li>
                <li>
                  <strong>Tracking Capacity:</strong> The system continuously tracks your team's real-time <DocLink href="/dashboard" onRequiresUpgrade={onRequiresUpgrade}>Capacity Matrix</DocLink> (competencies and bandwidth).
                </li>
                <li>
                  <strong>Look-Ahead Engine:</strong> In the WBS Planning Workspace, the AI compares the required skills of upcoming phases against the team's capacity matrix.
                </li>
                <li>
                  <strong>Proactive Alerting:</strong> If the AI detects a deficit (e.g., your only Data Scientist is fully booked during Phase 3), it surfaces an actionable warning.
                </li>
              </ol>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'adr-workflow-integration',
      title: 'ADR Workflow Integration',
      description: 'How Architecture Decision Records connect to WBS, RAID, and Capacity Planning through AI.',
      icon: ShieldCheck,
      keywords: ['adr', 'architecture', 'decision', 'raid', 'compliance', 'skill gap', 'wbs', 'workflow', 'ai', 'integration'],
      content: ({ onRequiresUpgrade }) => (
        <div className="space-y-6 animate-in fade-in duration-300 pb-4">

          {/* Overview */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-violet-500" />
              What is ADR Workflow Integration?
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Architecture Decision Records (ADRs) are immutable technical ledger entries that capture <em>why</em> a design decision was made.
                Without integration, they sit in isolation. This module wires ADRs directly into three execution layers:
                <strong className="text-app-fg"> WBS compliance, RAID risk extraction, and Capacity Skill Gap detection</strong>.
              </p>
              <div className="flex items-center gap-3 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-sm">
                <GitBranch className="w-5 h-5 text-violet-400 shrink-0" />
                <span>ADRs authored in the <strong className="text-app-fg">ADR Studio</strong> automatically propagate warnings and risks across your entire project lifecycle.</span>
              </div>
            </div>
          </section>

          {/* Integration 1 */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Integration 1 — RAID Extraction <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ml-1">Enterprise</span>
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Every architectural decision carries hidden risks and assumptions. When you set an ADR status to <strong className="text-app-fg">Accepted</strong>, the
                <strong className="text-app-fg"> Extract to RAID</strong> button appears inside the ADR Studio modal.
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Open an ADR and set its Lifecycle Status to <strong className="text-app-fg">Accepted</strong>.</li>
                <li>Scroll to the <strong className="text-app-fg">⚡ Workflow Integrations</strong> panel at the bottom of the modal.</li>
                <li>Click <strong className="text-app-fg">Extract to RAID</strong>. The AI scans the Context and Consequences sections.</li>
                <li>Review each suggested RAID entry (Risks, Assumptions, Dependencies). Click <strong className="text-app-fg">Add to RAID</strong> to approve entries one by one.</li>
                <li>Approved entries appear instantly in the <strong className="text-app-fg">RAID Command Center</strong> with the source ADR tracked.</li>
              </ol>
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs">
                <strong className="text-amber-500">Tier:</strong> Enterprise only. Uses your monthly AI Basic Actions allowance.
              </div>
            </div>
          </section>

          {/* Integration 2 */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Integration 2 — WBS Architecture Compliance <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 ml-1">Premium</span>
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                Developers sometimes implement tasks in ways that violate approved architecture decisions. This integration enforces ADR constraints
                at the task level <em>before</em> code is written.
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Open any WBS Story (Leaf) in the side panel.</li>
                <li>In the <strong className="text-app-fg">Linked Architecture Decisions</strong> field, select one or more relevant ADRs for this task.</li>
                <li>Click <strong className="text-app-fg">Verify Architecture Compliance</strong>. The AI reads the task description and compares it against each linked ADR's decision mandate.</li>
                <li>If a conflict is detected (e.g., task proposes REST but ADR mandates GraphQL), a detailed violation report is shown with an AI recommendation for correction.</li>
              </ol>
              <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-xs">
                <strong className="text-violet-400">Tier:</strong> Manual ADR linking is free. AI compliance check requires Premium. Uses your monthly AI Generations allowance.
              </div>
            </div>
          </section>

          {/* Integration 3 */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Integration 3 — Team Skill Gap Check <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 ml-1">Premium</span>
            </h3>
            <div className="space-y-3 text-app-muted">
              <p>
                When you commit to adopting a new technology (e.g., <em>"Migrate to Kubernetes"</em>), your team may not have the skills to execute it.
                This integration triggers automatically when an ADR is saved with <strong className="text-app-fg">Accepted</strong> status.
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Commit any ADR with Lifecycle Status set to <strong className="text-app-fg">Accepted</strong>.</li>
                <li>The AI immediately extracts the technologies mentioned in the Decision section.</li>
                <li>It cross-references these against your project's <strong className="text-app-fg">Team Capacity Matrix</strong> (member skill profiles and bandwidth).</li>
                <li>If a required skill is missing or the only team member with it is fully booked, a <strong className="text-app-fg">Skill Deficit Warning</strong> is shown inside the modal.</li>
                <li>You can also manually trigger the check via the <strong className="text-app-fg">Check Skills</strong> button in the Workflow Integrations panel.</li>
              </ol>
              <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-xs">
                <strong className="text-violet-400">Tier:</strong> Premium and above. Uses your monthly AI Generations allowance.
              </div>
            </div>
          </section>

          {/* Flow summary */}
          <section>
            <h3 className="text-lg font-bold text-app-fg mb-3 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-violet-400" />
              End-to-End Flow
            </h3>
            <div className="p-4 bg-app-card border border-app-border rounded-xl font-mono text-xs text-app-muted space-y-1">
              <p><span className="text-violet-400">ADR authored</span> → Status set to <span className="text-emerald-400">Accepted</span></p>
              <p className="pl-4">↳ <span className="text-amber-400">Skill Gap Check</span> auto-fires → warns if team is missing required tech skills</p>
              <p className="pl-4">↳ <span className="text-rose-400">RAID Extraction</span> (manual) → AI stages risks/assumptions for PM approval</p>
              <p><span className="text-violet-400">WBS Story created</span> → ADR linked to task</p>
              <p className="pl-4">↳ <span className="text-emerald-400">Compliance Check</span> (manual) → AI flags violations before development starts</p>
            </div>
          </section>

        </div>
      )
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
