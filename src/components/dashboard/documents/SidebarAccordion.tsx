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
    <div className="mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4 mb-2 pl-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
      >
        <span>{title}</span>
        <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-200 mr-2">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>
      <div 
        className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'max-h-[800px] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-0'
        }`}
      >
        <div className="flex flex-col gap-1 pb-1">
          {children}
        </div>
      </div>
    </div>
  )
}
