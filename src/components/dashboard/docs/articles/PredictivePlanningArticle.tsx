'use client'

import React from 'react'
import { DocLink } from '../components/DocLink'
import { TierId } from '@/lib/organizations/tier-logic'
import { Settings, Layers, Calendar, AlertTriangle } from 'lucide-react'

export function PredictivePlanningArticle({ onRequiresUpgrade }: { onRequiresUpgrade: (feature: string, tier: TierId) => void }) {
  return (
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

}
