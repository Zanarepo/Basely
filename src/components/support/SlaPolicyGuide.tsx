'use client'

import { useState } from 'react'
import { Info, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'

export function SlaPolicyGuide() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" />
        View SLA Guidelines
        <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
      </button>
    )
  }

  return (
    <div className="bg-app-card border border-indigo-500/30 rounded-2xl p-5 mb-6 relative shadow-sm">
      <button 
        onClick={() => setIsOpen(false)}
        className="absolute top-4 right-4 text-app-muted hover:text-app-fg p-1 rounded-md hover:bg-app-hover"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-indigo-500" />
        <h3 className="font-black text-app-fg text-sm">Service Level Agreement (SLA) Policy</h3>
      </div>
      
      <p className="text-xs text-app-muted mb-4 leading-relaxed max-w-3xl">
        Support SLAs dictate the maximum allowed <strong>Time to First Response</strong> based on the ticket's priority level. 
        If an account manager or support agent does not reply to the customer within the allotted time, the ticket breaches SLA and triggers automatic alerts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-app-surface border border-app-border rounded-xl p-3">
          <div className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-1">Urgent Priority</div>
          <div className="text-lg font-black text-app-fg">2 Hours</div>
          <div className="text-[10px] font-bold text-app-muted mt-1">Requires immediate intervention.</div>
        </div>
        
        <div className="bg-app-surface border border-app-border rounded-xl p-3">
          <div className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1">High Priority</div>
          <div className="text-lg font-black text-app-fg">4 Hours</div>
          <div className="text-[10px] font-bold text-app-muted mt-1">Critical issues blocking workflow.</div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-xl p-3">
          <div className="text-[10px] font-black text-app-fg uppercase tracking-wider mb-1">Medium Priority</div>
          <div className="text-lg font-black text-app-fg">24 Hours</div>
          <div className="text-[10px] font-bold text-app-muted mt-1">Standard inquiries and bugs.</div>
        </div>

        <div className="bg-app-surface border border-app-border rounded-xl p-3">
          <div className="text-[10px] font-black text-app-muted uppercase tracking-wider mb-1">Low Priority</div>
          <div className="text-lg font-black text-app-fg">No strict SLA</div>
          <div className="text-[10px] font-bold text-app-muted mt-1">Feature requests or minor questions.</div>
        </div>
      </div>
    </div>
  )
}
