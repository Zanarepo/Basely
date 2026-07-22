'use client'

import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  badge,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden transition-all duration-200 shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-app-hover/50 transition-colors cursor-pointer group select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-app-fg tracking-tight group-hover:text-indigo-400 transition-colors">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-app-muted truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-app-surface-solid border border-app-border group-hover:border-app-border-hover text-app-subtle group-hover:text-app-fg transition-all">
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-app-border animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}
