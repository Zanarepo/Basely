'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface SidebarAccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SidebarAccordion({ title, children, defaultOpen = false }: SidebarAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between text-xs font-bold text-app-muted uppercase tracking-wider mt-4 mb-2 pl-2 hover:text-app-fg transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <div className="p-1 hover:bg-app-hover rounded">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>
      {isOpen && (
        <div className="flex flex-col gap-1 overflow-hidden transition-all">
          {children}
        </div>
      )}
    </div>
  )
}
