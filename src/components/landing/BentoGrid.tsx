export function BentoGrid() {
  return (
    <section className="px-6 py-8 bg-[#000000]">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-14 animate-fade-in-up">
          <p className="font-mono text-[11px] text-violet-400/60 mb-3 tracking-widest">EVERYTHING RUNS ON ONE WBS</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">One work breakdown. Every downstream number stays correct.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          {/* Project Initiation & Planning */}
          <div className="landing-card md:col-span-2">
            <div>
              <p className="text-[13px] font-semibold mb-2 text-white">Project Initiation & Planning</p>
              <p className="text-slate-500 text-[13px] leading-relaxed">Start with clarity and precision. Build your WBS natively or import from existing templates.</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-1.5">
              {['Discovery', 'Planning', 'Execution', 'QA', 'Go-live', 'Close'].map((phase, i) => (
                <div key={phase} className={`h-6 rounded flex items-center justify-center border ${
                  i === 4 ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.03] border-white/[0.06]'
                }`}>
                  <span className={`text-[9px] font-mono ${i === 4 ? 'text-violet-400/80' : 'text-slate-600'}`}>{phase}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget & EVM */}
          <div className="landing-card md:col-span-1">
            <div>
              <p className="text-[13px] font-semibold mb-2 text-white">Budget & EVM</p>
              <p className="text-slate-500 text-[13px] mb-5 leading-relaxed">Assign cost baselines to your WBS.</p>
            </div>
            <div className="font-mono text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
              1.06 <span className="text-sm text-slate-500 bg-none" style={{ WebkitTextFillColor: 'rgb(107 114 128)' }}>CPI</span>
            </div>
          </div>

          {/* Critical Path & Dependencies */}
          <div className="landing-card md:col-span-1">
            <div>
              <p className="text-[13px] font-semibold mb-2 text-white">Critical Path</p>
              <p className="text-slate-500 text-[13px] mb-5 leading-relaxed">Full forward/backward pass CPM engine with dependency mapping.</p>
            </div>
            <div className="flex gap-1 items-end h-8">
              {[40, 60, 35, 80, 55, 90, 45].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ 
                  height: `${h}%`, 
                  background: i === 3 || i === 5 ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'
                }} />
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="landing-card md:col-span-1">
            <div>
              <p className="text-[13px] font-semibold mb-2 text-white">Resources</p>
              <p className="text-slate-500 text-[13px] mb-4 leading-relaxed">Complete visibility into workload.</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-4 rounded bg-violet-500/[0.12] border border-violet-500/[0.2]"></div>
              <div className="h-4 rounded bg-white/[0.06] border border-white/[0.06]"></div>
              <div className="h-4 rounded bg-indigo-500/[0.15] border border-indigo-500/[0.25]"></div>
              <div className="h-4 rounded bg-white/[0.06] border border-white/[0.06]"></div>
            </div>
          </div>

          {/* Governance */}
          <div className="landing-card md:col-span-1">
            <div>
              <p className="text-[13px] font-semibold mb-2 text-white">Governance</p>
              <p className="text-slate-500 text-[13px] leading-relaxed">End-to-end approvals and audit trails.</p>
            </div>
            <div className="mt-6 space-y-1.5">
              {[
                { label: 'Pending review', color: 'bg-violet-400/60' },
                { label: 'Approved', color: 'bg-indigo-400/40' },
                { label: 'Rejected', color: 'bg-white/10' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                  <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Risk & Issues */}
          <div className="landing-card md:col-span-2">
            <div>
              <p className="text-[13px] font-semibold mb-2 text-white">Risk & Issues Management</p>
              <p className="text-slate-500 text-[13px] leading-relaxed">Proactive mitigation before slip happens. Instantly link risks to critical path items.</p>
            </div>
            <div className="mt-6 flex gap-3">
              {[
                { label: 'High', count: '2', color: 'text-violet-400 border-violet-500/25 bg-violet-500/[0.08]' },
                { label: 'Medium', count: '5', color: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/[0.08]' },
                { label: 'Low', count: '8', color: 'text-slate-500 border-white/10 bg-white/[0.03]' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`flex-1 rounded-lg border px-3 py-2 text-center ${color}`}>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] font-mono opacity-70">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documentation */}
          <div className="landing-card md:col-span-4">
            <div>
              <p className="text-[13px] font-semibold mb-2 text-white">End-to-End Documentation</p>
              <p className="text-slate-500 text-[13px] mb-5 max-w-xl leading-relaxed">Charters, WBS dictionaries, status reports, and closure docs — generated from live data, never hand-assembled.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Charter.pdf', 'Status_report.docx', 'Closure_report.pdf', 'Risk_register.xlsx', 'Change_request.pdf'].map((f, i) => (
                <span key={f} className={`text-[11px] font-mono px-3 py-1.5 rounded border transition-colors cursor-default ${
                  i === 0 ? 'border-violet-500/25 text-violet-300/70 bg-violet-500/[0.06]' : 'border-white/[0.07] text-slate-500 bg-white/[0.02] hover:border-white/20 hover:text-slate-400'
                }`}>{f}</span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
