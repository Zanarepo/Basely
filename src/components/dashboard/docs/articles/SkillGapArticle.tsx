'use client'

import React from 'react'
import { DocLink } from '../components/DocLink'
import { TierId } from '@/lib/organizations/tier-logic'
import { Sparkles, CheckCircle2 } from 'lucide-react'

export function SkillGapArticle({ onRequiresUpgrade }: { onRequiresUpgrade: (feature: string, tier: TierId) => void }) {
  return (
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
}
