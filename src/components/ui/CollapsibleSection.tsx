'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function CollapsibleSection({ 
  title, 
  description, 
  icon, 
  children, 
  defaultOpen = false,
  className = "mb-16",
  contentClassName = "p-6"
}: { 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  children: React.ReactNode, 
  defaultOpen?: boolean,
  className?: string,
  contentClassName?: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className={`bg-app-surface-solid rounded-2xl border border-app-border shadow-sm overflow-hidden ${className}`}>
      <div 
        className="p-6 border-b border-app-border flex items-center justify-between cursor-pointer hover:bg-app-surface-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-fg">{title}</h2>
            <p className="text-sm text-app-muted">{description}</p>
          </div>
        </div>
        <div className="text-app-muted p-2 hover:text-app-fg rounded-lg hover:bg-app-surface-muted transition-colors cursor-pointer">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>
      
      {isOpen && (
        <div className={contentClassName}>
          {children}
        </div>
      )}
    </div>
  )
}
