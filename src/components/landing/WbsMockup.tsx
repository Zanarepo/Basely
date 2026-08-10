import { CheckSquare, ChevronDown } from 'lucide-react'

export function WbsMockup() {
  return (
    <div className="w-full rounded-2xl bg-app-surface-solid border border-app-border overflow-hidden shadow-2xl font-sans">
      
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-app-border bg-app-card text-xs font-semibold text-app-muted tracking-wider">
        <div className="w-6 mr-3"><CheckSquare className="w-4 h-4 opacity-50" /></div>
        <div className="flex-1">WORK BREAKDOWN</div>
        <div className="w-24 text-center">OWNER</div>
        <div className="w-24 text-right">BUDGET</div>
      </div>

      {/* Waterfall Phase Row */}
      <div className="flex items-center px-6 py-3 border-b border-app-border/50 bg-app-bg hover:bg-app-surface transition-colors cursor-pointer">
        <div className="w-6 mr-3 text-app-muted flex items-center justify-center"><ChevronDown className="w-4 h-4" /></div>
        <div className="flex-1 flex items-center gap-3">
          <span className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-[10px] font-mono">1</span>
          <span className="font-semibold text-app-fg text-sm">Phase 1: Pre-Construction & Design</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Waterfall</span>
        </div>
        <div className="w-24 flex justify-center">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] flex items-center justify-center font-bold border border-emerald-500/30">PR</div>
        </div>
        <div className="w-24 text-right font-mono text-sm text-emerald-400 font-semibold">$32,500.00</div>
      </div>

      {/* Child 1.1 */}
      <div className="flex items-center px-6 py-3 border-b border-app-border/50 bg-app-bg hover:bg-app-surface transition-colors">
        <div className="w-6 mr-3"></div>
        <div className="flex-1 flex items-center gap-3 pl-6">
          <span className="w-2 h-2 rounded-full bg-app-muted/30"></span>
          <span className="w-7 text-[10px] font-mono text-app-muted">1.1</span>
          <span className="font-medium text-app-fg text-sm">Architectural & Structural Drawings</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">Work Package</span>
        </div>
        <div className="w-24 flex justify-center">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] flex items-center justify-center font-bold border border-emerald-500/30">PR</div>
        </div>
        <div className="w-24 text-right font-mono text-sm text-app-muted">$15,000.00</div>
      </div>

      {/* Child 1.2 */}
      <div className="flex items-center px-6 py-3 border-b border-app-border/50 bg-app-bg hover:bg-app-surface transition-colors">
        <div className="w-6 mr-3"></div>
        <div className="flex-1 flex items-center gap-3 pl-6">
          <span className="w-2 h-2 rounded-full bg-app-muted/30"></span>
          <span className="w-7 text-[10px] font-mono text-app-muted">1.2</span>
          <span className="font-medium text-app-fg text-sm">Building Permits & Regulatory Approvals</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">Work Package</span>
        </div>
        <div className="w-24 flex justify-center">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-[10px] flex items-center justify-center font-bold border border-amber-500/30">ZA</div>
        </div>
        <div className="w-24 text-right font-mono text-sm text-app-muted">$12,500.00</div>
      </div>

      {/* Child 1.3 */}
      <div className="flex items-center px-6 py-3 border-b border-app-border/50 bg-app-bg hover:bg-app-surface transition-colors">
        <div className="w-6 mr-3"></div>
        <div className="flex-1 flex items-center gap-3 pl-6">
          <span className="w-2 h-2 rounded-full bg-app-muted/30"></span>
          <span className="w-7 text-[10px] font-mono text-app-muted">1.3</span>
          <span className="font-medium text-app-fg text-sm">Site Survey & Soil Testing</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">Work Package</span>
        </div>
        <div className="w-24 flex justify-center">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 text-[10px] flex items-center justify-center font-bold border border-indigo-500/30">JD</div>
        </div>
        <div className="w-24 text-right font-mono text-sm text-app-muted">$5,000.00</div>
      </div>

    </div>
  )
}
