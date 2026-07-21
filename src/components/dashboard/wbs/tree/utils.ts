import type { WbsStatus } from '@/lib/wbs/constants'

export function getStatusColor(status: WbsStatus) {
  switch (status) {
    case 'Complete':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    case 'In Progress':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    case 'On Hold':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    default:
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20'
  }
}

export function getProgressColor(progress: number) {
  if (progress === 0) return 'bg-slate-200 dark:bg-slate-700'
  if (progress < 33) return 'bg-rose-500'
  if (progress < 66) return 'bg-amber-500'
  if (progress < 100) return 'bg-indigo-500'
  return 'bg-emerald-500'
}
