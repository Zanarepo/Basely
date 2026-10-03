'use client'

import React from 'react'
import { DocLink } from '../components/DocLink'
import { TierId } from '@/lib/organizations/tier-logic'
import { ShieldCheck, GitBranch, AlertTriangle, CheckCircle2, Users, ArrowRight } from 'lucide-react'

export function AdrWorkflowArticle({ onRequiresUpgrade }: { onRequiresUpgrade: (feature: string, tier: TierId) => void }) {
  return (
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
}
