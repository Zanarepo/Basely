import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  title: string
  type: 'success' | 'info' | 'warning' | 'error'
}

interface ToastProps {
  toasts: ToastMessage[]
  dismissToast: (id: string) => void
}

export default function ToastContainer({ toasts, dismissToast }: ToastProps) {
  if (!toasts.length) return null

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2.5 max-w-md w-full pointer-events-none sm:top-6 sm:right-6">
      {toasts.map((toast, idx) => (
        <div
          key={`${toast.id}_${idx}`}
          className={`pointer-events-auto px-4 py-3.5 rounded-2xl border shadow-2xl flex items-start gap-3 text-xs font-semibold text-app-fg backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 text-rose-600 dark:text-rose-300 shadow-rose-500/10'
              : toast.type === 'warning'
              ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-amber-500/10'
              : toast.type === 'info'
              ? 'bg-violet-500/10 dark:bg-violet-950/40 border-violet-500/30 text-violet-700 dark:text-violet-300 shadow-violet-500/10'
              : 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-violet-500" />}
          </div>
          <span className="flex-1 leading-relaxed text-slate-800 dark:text-slate-100">{toast.title}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0 transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
