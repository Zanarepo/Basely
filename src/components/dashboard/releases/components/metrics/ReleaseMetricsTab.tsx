import { AlertOctagon, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import type { Release } from '@/lib/releases/types'
import { useReleaseMetrics } from '../../hooks/useReleaseMetrics'
import CostHealthWidget from '../../../projects/widgets/CostHealthWidget'
import ReleaseChecklistSummaryWidget from './ReleaseChecklistSummaryWidget'
import ReleaseBurndownWidget from './ReleaseBurndownWidget'

export default function ReleaseMetricsTab({
  release,
  methodology
}: {
  release: Release
  methodology: string
}) {
  const { loading, metrics, refresh } = useReleaseMetrics(release)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-app-subtle">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Calculating release health & metrics...</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-app-subtle">
        <AlertCircle className="w-8 h-8 mb-4 text-amber-500" />
        <p>No metrics available for this release.</p>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
          Retry
        </button>
      </div>
    )
  }

  const getRagDetails = () => {
    switch (metrics.ragStatus) {
      case 'Red':
        return {
          bg: 'bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/25',
          text: 'text-rose-700 dark:text-rose-400',
          title: 'Critical Attention Required',
          description: 'Significant cost overruns, schedule delays, or critical path slippage detected in this release.',
          icon: <AlertOctagon className="h-6 w-6 text-rose-500 shrink-0" />
        }
      case 'Amber':
        return {
          bg: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25',
          text: 'text-amber-700 dark:text-amber-400',
          title: 'Caution / At Risk',
          description: 'Minor variance in schedule milestones or cost performance index observed for this release.',
          icon: <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
        }
      case 'Green':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25',
          text: 'text-emerald-700 dark:text-emerald-400',
          title: 'Release on Track',
          description: 'Schedule milestones and budget thresholds are matching target baselines for this release.',
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
        }
    }
  }

  const rag = getRagDetails()

  return (
    <div className="space-y-6 pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-app-fg">Health & Metrics</h2>
          <p className="text-sm text-app-muted mt-1">Data scoped specifically to this release's deliverables and iterations.</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white dark:bg-app-surface border border-app-border rounded-lg hover:bg-gray-50 dark:hover:bg-app-hover text-app-fg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Live Data
        </button>
      </div>

      {/* RAG Banner */}
      <div className={`border rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm transition-all ${rag.bg}`}>
        <div className="p-2 bg-white dark:bg-app-surface rounded-2xl shadow-sm border border-app-border/40">
          {rag.icon}
        </div>
        <div>
          <h2 className={`text-lg font-black tracking-tight ${rag.text}`}>
            Release RAG: {rag.title} ({metrics.ragStatus})
          </h2>
          <p className="text-xs text-app-muted mt-0.5">{rag.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReleaseBurndownWidget data={metrics.burnDownData} methodology={methodology} />
        
        <div className="flex flex-col gap-6">
          <ReleaseChecklistSummaryWidget 
            exitCriteriaPct={metrics.completionMetrics.exitCriteriaPct}
            readinessPct={metrics.completionMetrics.readinessPct}
          />
          <CostHealthWidget health={metrics.costHealth} currency="USD" />
        </div>
      </div>
    </div>
  )
}
