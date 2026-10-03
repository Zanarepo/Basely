import { DocumentProperties } from '@/components/dashboard/documents/hooks/useDocumentProperties'

export const STATUS_OPTIONS: Array<{ value: DocumentProperties['status']; label: string; color: string }> = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  { value: 'in_review', label: 'In Review', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { value: 'changes_requested', label: 'Changes Requested', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { value: 'archived', label: 'Archived', color: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
]

export const PRIORITY_OPTIONS: Array<{ value: DocumentProperties['priority']; label: string; color: string }> = [
  { value: 'P0', label: 'P0 - Critical', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-black' },
  { value: 'P1', label: 'P1 - High', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold' },
  { value: 'P2', label: 'P2 - Medium', color: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30 font-semibold' },
  { value: 'P3', label: 'P3 - Low', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-normal' },
]

export function getStatusBadgeStyle(status: DocumentProperties['status']) {
  const found = STATUS_OPTIONS.find((s) => s.value === status)
  return found?.color || 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
}

export function getPriorityBadgeStyle(priority: DocumentProperties['priority']) {
  const found = PRIORITY_OPTIONS.find((p) => p.value === priority)
  return found?.color || 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
}
