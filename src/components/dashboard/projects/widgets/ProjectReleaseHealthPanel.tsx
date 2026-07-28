'use client'

import React from 'react'
import { X, Activity } from 'lucide-react'
import type { Release } from '@/lib/releases/types'
import ReleaseMetricsTab from '../../releases/components/metrics/ReleaseMetricsTab'

export default function ProjectReleaseHealthPanel({ 
  release, 
  methodology,
  isOpen, 
  onClose 
}: { 
  release: Release | null
  methodology: string
  isOpen: boolean
  onClose: () => void 
}) {
  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-2xl bg-white dark:bg-app-card shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-in-out border-l border-app-border ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border shrink-0 bg-app-surface/40">
          <div>
            <h2 className="text-xl font-black text-app-fg tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-indigo-500" />
              Active Release Health
            </h2>
            <p className="text-sm text-app-muted mt-1 font-medium">
              {release ? `Viewing metrics for: ${release.name}` : 'No active release found.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-app-surface p-6">
          {release ? (
            <div className="bg-app-card border border-app-border rounded-3xl overflow-hidden shadow-sm p-4">
              <ReleaseMetricsTab release={release} methodology={methodology} />
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="mx-auto w-12 h-12 bg-white dark:bg-gray-800 border border-app-border rounded-full flex items-center justify-center mb-3 shadow-sm">
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-app-subtle">No active release.</p>
              <p className="text-xs text-app-muted mt-1">Start a release to see its health metrics here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
