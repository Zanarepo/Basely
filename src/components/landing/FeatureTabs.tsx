'use client'

import { useState } from 'react'

export function FeatureTabs() {
  const [activeTab, setActiveTab] = useState<'pm' | 'pmo' | 'agency'>('pm')

  return (
    <section className="px-6 pb-4 bg-[#000000]">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center gap-0 border-b border-white/[0.06] mb-10">
          {(['pm', 'pmo', 'agency'] as const).map((tab) => {
            const labels = { pm: 'For project managers', pmo: 'For PMOs', agency: 'For agencies' }
            return (
              <button
                key={tab}
                className={`px-5 py-3 text-[13px] font-medium border-b-2 transition-all ${
                  activeTab === tab
                    ? 'text-white border-violet-500'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto relative min-h-[280px]">
        
        {/* PM Panel */}
        <div className={`transition-all duration-300 ${activeTab === 'pm' ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-2 absolute pointer-events-none'}`}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="font-mono text-[10px] text-violet-400/50 mb-3 tracking-widest">01 — SINGLE-PROJECT VIEW</p>
              <h3 className="text-2xl font-semibold mb-3 text-white">Build the plan once. Watch it stay correct.</h3>
              <p className="text-slate-400 leading-relaxed text-[14px]">Your WBS, schedule, and budget share one spine. Move a task, and cost, float, and risk recalculate before you&apos;ve released the mouse.</p>
            </div>
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.06] p-5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-3">
                <span>Budget baseline</span><span className="text-violet-400">CPI 1.04</span>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{width: '72%'}}></div></div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500" style={{width: '88%'}}></div></div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden"><div className="h-full rounded-full bg-white/20" style={{width: '45%'}}></div></div>
              </div>
            </div>
          </div>
        </div>

        {/* PMO Panel */}
        <div className={`transition-all duration-300 ${activeTab === 'pmo' ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-2 absolute pointer-events-none'}`}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="font-mono text-[10px] text-violet-400/50 mb-3 tracking-widest">02 — PORTFOLIO VIEW</p>
              <h3 className="text-2xl font-semibold mb-3 text-white">Know which of your 40 projects need you today.</h3>
              <p className="text-slate-400 leading-relaxed text-[14px]">One RAG rollup across every project in the workspace, sorted by the ones actually slipping — not the ones with the loudest status report.</p>
            </div>
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.06] p-5 space-y-1.5">
              <div className="flex items-center justify-between text-[13px] px-3 py-2 rounded-lg bg-violet-500/[0.07] border border-violet-500/10 text-white"><span>Atlas migration</span><span className="w-1.5 h-1.5 rounded-full bg-violet-400/70"></span></div>
              <div className="flex items-center justify-between text-[13px] px-3 py-2 rounded-lg bg-white/[0.03] text-slate-400"><span>Vendor onboarding</span><span className="w-1.5 h-1.5 rounded-full bg-white/20"></span></div>
              <div className="flex items-center justify-between text-[13px] px-3 py-2 rounded-lg bg-white/[0.03] text-slate-400"><span>Q3 platform refresh</span><span className="w-1.5 h-1.5 rounded-full bg-white/10"></span></div>
            </div>
          </div>
        </div>

        {/* Agency Panel */}
        <div className={`transition-all duration-300 ${activeTab === 'agency' ? 'opacity-100 translate-y-0 relative' : 'opacity-0 translate-y-2 absolute pointer-events-none'}`}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="font-mono text-[10px] text-violet-400/50 mb-3 tracking-widest">03 — CLIENT-FACING</p>
              <h3 className="text-2xl font-semibold mb-3 text-white">Status reports your client didn&apos;t have to ask for.</h3>
              <p className="text-slate-400 leading-relaxed text-[14px]">Auto-generated from live schedule and budget data, exportable to PDF, with sign-off links clients can approve without a login.</p>
            </div>
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.06] p-5">
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 mb-4">Status_Report_Week32.pdf</div>
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between text-slate-500"><span>Schedule health</span><span className="text-indigo-400/80">On track</span></div>
                <div className="flex justify-between text-slate-500"><span>Budget variance</span><span className="text-violet-400/70">+2.1%</span></div>
                <div className="flex justify-between text-slate-500"><span>Open risks</span><span className="text-white/40">2 high</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
