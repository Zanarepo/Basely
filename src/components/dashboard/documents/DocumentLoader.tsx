import React from 'react'

export interface DocumentLoaderProps {
  message?: string
}

export function DocumentLoader({ message = "Loading Document Engine..." }: DocumentLoaderProps) {
  return (
    <div className="flex w-full h-full min-h-[400px] items-center justify-center bg-app-surface border border-app-border rounded-xl shadow-sm animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-sm text-app-muted font-medium">{message}</p>
      </div>
    </div>
  )
}
