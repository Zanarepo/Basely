import React from 'react'
import { Sparkles, BrainCircuit, UserCircle, ListTodo, Boxes, AlertTriangle, Zap, CheckCircle2, ChevronRight, CornerDownRight } from 'lucide-react'

export function AiCapabilityShowcase() {
  return (
    <section className="px-6 py-24 bg-[#000000] border-t border-white/[0.05] relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-medium tracking-wide mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            AI-POWERED WORKFLOW
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-6">
            From raw customer insight to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              flawless execution.
            </span>
          </h2>
          <p className="text-slate-400 text-[16px] leading-relaxed">
            Stop manually translating customer feedback into tasks. Watch as our Praz-AI automatically extracts insights, updates your personas, builds a prioritized backlog, and deconstructs it into detailed execution plans.
          </p>
        </div>

        {/* The Pipeline Visualization (2x2 Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 relative max-w-5xl mx-auto">
          
          {/* Decorative Connecting Lines (Desktop only) */}
          <div className="hidden md:block absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 text-white/10">
             {/* Center junction */}
             <div className="w-px h-full absolute left-1/2 bg-gradient-to-b from-transparent via-violet-500/20 to-transparent" />
             <div className="h-px w-full absolute top-1/2 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          </div>

          {/* Step 1: Raw Insights */}
          <div className="relative group animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full p-6 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">1. Raw Insights</h3>
                  <p className="text-xs text-slate-500">Log customer interviews & tickets.</p>
                </div>
              </div>
              
              {/* Mock UI: Customer Interview Card */}
              <div className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-left mt-auto">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Struggling to track material deliveries</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      "I spend 2 hours every morning calling suppliers. We have no single dashboard showing delivery status, leading to schedule delays."
                    </p>
                    <div className="flex gap-2 text-[10px] font-mono">
                      <span className="px-2 py-1 rounded bg-white/5 text-slate-300 border border-white/10">Customer Interview</span>
                      <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">🟠 High Severity</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Persona Enrichment */}
          <div className="relative group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="absolute -inset-0.5 bg-gradient-to-b from-violet-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full p-6 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl flex flex-col shadow-[0_0_30px_-10px_rgba(124,58,237,0.15)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-400">
                  <UserCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">2. Persona Enrichment</h3>
                  <p className="text-xs text-slate-500">Praz-AI synthesizes insights into profiles.</p>
                </div>
              </div>
              
              {/* Mock UI: Persona Card */}
              <div className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-left mt-auto">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                      S
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Sarah</div>
                      <div className="text-[11px] text-slate-400">Site Supervisor</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-1 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Enriched
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-mono text-violet-400/80 mb-1">UPDATED JTBD</div>
                    <p className="text-xs text-slate-300">"I need to know exactly when materials arrive so I can accurately schedule subcontractors."</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-violet-400/80 mb-1">NEW PAIN POINT</div>
                    <p className="text-xs text-slate-300">"Manual phone calls cause schedule delays and overlapping trades on site."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Prioritized Backlog */}
          <div className="relative group animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute -inset-0.5 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full p-6 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl flex flex-col shadow-[0_0_30px_-10px_rgba(99,102,241,0.1)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">3. Prioritized Backlog</h3>
                  <p className="text-xs text-slate-500">Praz-AI drafts Epics and scores them.</p>
                </div>
              </div>
              
              {/* Mock UI: Backlog Card */}
              <div className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-left mt-auto">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono mb-1">EPIC-042</div>
                    <h4 className="text-sm font-medium text-white leading-tight">Automated Material Tracking Dashboard</h4>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    🔴 MUST HAVE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  A centralized dashboard linking supplier delivery ETAs directly to the master construction schedule...
                </p>
                <div className="pt-3 border-t border-white/[0.05] flex justify-end">
                  <button className="text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-default">
                    <Zap className="w-3 h-3 text-indigo-200" />
                    Send to WBS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: WBS Deconstruction */}
          <div className="relative group animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full p-6 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl flex flex-col shadow-[0_0_30px_-10px_rgba(16,185,129,0.1)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">4. WBS Execution</h3>
                  <p className="text-xs text-slate-500">Fully deconstructed execution plans.</p>
                </div>
              </div>
              
              {/* Mock UI: WBS Tree */}
              <div className="w-full bg-[#111111] border border-white/[0.05] rounded-xl overflow-hidden mt-auto">
                {/* WBS Header Row */}
                <div className="bg-white/[0.03] px-3 py-2 border-b border-white/[0.05] flex items-center gap-2">
                   <div className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-bold">E</div>
                   <span className="text-xs font-semibold text-white truncate">Automated Material Tracking...</span>
                </div>
                
                {/* Story Row */}
                <div className="px-3 py-2 flex items-start gap-2 relative">
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3.5 h-3.5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[8px] font-bold shrink-0">S</div>
                      <span className="text-[11px] text-slate-200 truncate leading-tight">As a supervisor, I want to see a live map of delivery trucks.</span>
                    </div>
                    {/* Edge case badge */}
                    <div className="pl-5">
                      <span className="inline-flex text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400/80 rounded border border-amber-500/20 truncate max-w-full">
                        Edge Case: GPS signal lost on site?
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Row */}
                <div className="px-3 py-2 pb-3 flex items-start gap-2 relative bg-white/[0.02]">
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[8px] font-bold shrink-0">T</div>
                      <span className="text-[11px] text-slate-300 truncate leading-tight">Integrate Vendor GPS API</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
