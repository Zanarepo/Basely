import React from 'react'
import { Loader2 } from 'lucide-react'

export interface DocumentLoaderProps {
  message?: string
}

export function DocumentLoader({ message = "Loading..." }: DocumentLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 min-h-[400px]">
      <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 shadow-xs">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
      <p className="text-xs font-semibold text-app-muted animate-pulse">{message}</p>
    </div>
  )
}
