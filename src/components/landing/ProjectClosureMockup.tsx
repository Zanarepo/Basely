import React from 'react'
import { FileText, Printer, Save, CheckCircle2, AlertTriangle, Layers } from 'lucide-react'

export function ProjectClosureMockup() {
  return (
    <div className="w-full bg-[#05050A] rounded-2xl overflow-hidden font-sans border border-white/5 flex flex-col">
      {/* Dashboard Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight mb-1">Project Closure & Performance Report</h2>
            <p className="text-slate-400 text-[13px]">Verified end-of-project EVM financial summary, schedule adherence, and deliverable sign-offs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="w-10 h-10 rounded-lg border border-white/10 hover:bg-white/5 flex items-center justify-center text-slate-300 transition-colors">
            <Printer className="w-4 h-4" />
          </button>
          <button className="px-4 h-10 rounded-lg bg-[#9D4EDD] hover:bg-[#8A3FD9] text-white text-sm font-semibold flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" />
            Freeze Closure Snapshot
          </button>
        </div>
      </div>

      {/* Dashboard Body - 2 Columns */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6 flex flex-col">
          
          {/* Section 1 */}
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest text-white/50 mb-3 uppercase">Section 1: Executive Closure Statement</h3>
            <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-5 text-[13px] text-slate-300 leading-relaxed">
              Formal Project Closure Report summarizing verified EVM metrics, completed schedule baselines, deliverable acceptance, and residual risk assessments upon entering the Closing phase. All core deliverables have been signed off by primary stakeholders.
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold tracking-widest text-white/50 uppercase flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Section 3: Deliverable Adherence
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold tracking-wide border border-cyan-500/20">
                100% Completed
              </span>
            </div>
            
            <div className="bg-[#0A0A0F] border border-white/5 rounded-xl overflow-hidden flex-1">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-white/5 text-white/40">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-16">WBS</th>
                    <th className="px-4 py-3 font-semibold">Deliverable Name</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {[
                    { wbs: '1.1', name: 'Database Architecture', status: 'Complete' },
                    { wbs: '1.2', name: 'Authentication API', status: 'Complete' },
                    { wbs: '1.3', name: 'Payment Gateway Integration', status: 'Complete' },
                    { wbs: '2.1', name: 'User Dashboard UI', status: 'Complete' },
                    { wbs: '2.2', name: 'Analytics Reporting Module', status: 'Complete' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-violet-400">{row.wbs}</td>
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6 flex flex-col">
          
          {/* Section 2 */}
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest text-emerald-400/80 mb-3 uppercase flex items-center gap-2">
              <span className="text-emerald-400 font-serif font-bold text-sm leading-none">$</span>
              Section 2: Final EVM Reconciliation
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] font-semibold mb-1">Budget at Completion (BAC)</div>
                <div className="text-xl font-bold text-white font-mono tracking-tight">$24,500</div>
                <div className="text-slate-500 text-[10px] mt-1">Total planned baseline</div>
              </div>
              <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] font-semibold mb-1">Actual Cost (AC)</div>
                <div className="text-xl font-bold text-emerald-400 font-mono tracking-tight">$22,150</div>
                <div className="text-slate-500 text-[10px] mt-1">Total recorded spend</div>
              </div>
              <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] font-semibold mb-1">Cost Variance (CV)</div>
                <div className="text-xl font-bold text-emerald-400 font-mono tracking-tight">+$2,350</div>
                <div className="text-slate-500 text-[10px] mt-1">Under Budget</div>
              </div>
              <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-4">
                <div className="text-slate-400 text-[11px] font-semibold mb-1">Final CPI / SPI</div>
                <div className="text-xl font-bold font-mono tracking-tight flex items-baseline gap-1">
                  <span className="text-[#9D4EDD]">1.10</span> <span className="text-xs text-white/40 font-sans">CPI</span>
                  <span className="text-white/20 px-1">/</span>
                  <span className="text-cyan-400">1.05</span> <span className="text-xs text-white/40 font-sans">SPI</span>
                </div>
                <div className="text-slate-500 text-[10px] mt-1">Efficiency threshold ≥ 1.00</div>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold tracking-widest text-amber-400/80 uppercase flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Section 4: Residual Exposures
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Mitigated: <span className="text-emerald-400">2</span> / Total: 2</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-4 flex flex-col justify-center">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-[13px] text-white">Third-party API Rate Limits</span>
                  <span className="text-[10px] px-2 py-0.5 rounded text-pink-400 bg-pink-500/10 border border-pink-500/20 font-medium">3 Impact</span>
                </div>
                <div className="text-[12px] text-slate-400"><span className="text-violet-400 font-medium">Mitigation Plan:</span> Implemented caching layer and fallback queues.</div>
              </div>
            </div>
          </div>

          {/* Appendix */}
          <div className="flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest text-white/50 mb-3 uppercase flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              Appendix: EVM Calculations
            </h3>
            
            <div className="bg-[#0A0A0F] border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="border-b border-white/5 text-white/40">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Metric</th>
                    <th className="px-4 py-2.5 font-semibold">Formula</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  <tr>
                    <td className="px-4 py-2.5 font-medium">Planned Value (PV)</td>
                    <td className="px-4 py-2.5 font-mono text-violet-300 text-[10px]">BAC × % planned complete</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-white text-right">$24,500</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium">Earned Value (EV)</td>
                    <td className="px-4 py-2.5 font-mono text-violet-300 text-[10px]">BAC × % actually complete</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-white text-right">$24,500</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium">Variance at Completion (VAC)</td>
                    <td className="px-4 py-2.5 font-mono text-violet-300 text-[10px]">BAC - EAC</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-emerald-400 text-right">+$2,350</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
