'use client'

import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export type ToastMessage = {
  id: string
  type: ToastType
  message: string
}

type ToastProps = {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-xl animate-slide-up-fade-in transition-all duration-300 ${
        toast.type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500 dark:text-emerald-400'
          : toast.type === 'error'
          ? 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400'
          : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-500 dark:text-indigo-400'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="shrink-0">
          {toast.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
          {toast.type === 'info' && <Info className="h-5 w-5" />}
        </span>
        <span className="text-sm font-semibold leading-normal">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg text-app-subtle hover:text-app-fg hover:bg-app-hover transition-all cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
