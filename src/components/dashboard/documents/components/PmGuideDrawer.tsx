import React from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { DocumentItem } from '../constants/documentDefinitions'

interface PmGuideDrawerProps {
  guide: DocumentItem['guide']
}

export default function PmGuideDrawer({ guide }: PmGuideDrawerProps) {
  return (
    <div className="p-4 rounded-3xl bg-violet-500/10 border border-violet-500/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300 font-extrabold text-sm">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span>💡 PM Guide: How to write this document effectively</span>
        </div>
        <span className="text-[11px] text-app-muted font-medium">
          Audience: <strong className="text-app-fg">{guide.audience}</strong>
        </span>
      </div>

      <p className="text-xs text-app-fg font-medium leading-relaxed">{guide.purpose}</p>

      <div className="space-y-1.5 pt-1">
        <div className="text-[11px] font-black text-app-subtle uppercase tracking-wider">Best Practices</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {guide.bestPractices.map((bp, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-app-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{bp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
