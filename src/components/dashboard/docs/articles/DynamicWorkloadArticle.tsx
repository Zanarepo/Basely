'use client'

import React from 'react'
import { DocLink } from '../components/DocLink'
import { TierId } from '@/lib/organizations/tier-logic'
import { Sparkles, AlertTriangle } from 'lucide-react'

export function DynamicWorkloadArticle({ onRequiresUpgrade }: { onRequiresUpgrade: (feature: string, tier: TierId) => void }) {
  return (
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
}
