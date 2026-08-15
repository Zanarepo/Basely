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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, idx) => (
        <div
          key={`${toast.id}_${idx}`}
          className="pointer-events-auto px-4 py-3 rounded-2xl bg-app-surface-solid border border-app-border shadow-xl flex items-center gap-3 text-xs font-bold text-app-fg animate-in slide-in-from-bottom-3 duration-200"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-violet-500 shrink-0" />}
          <span>{toast.title}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="p-1 hover:bg-app-hover rounded-lg text-app-muted hover:text-app-fg ml-2 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
