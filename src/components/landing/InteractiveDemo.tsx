export function InteractiveDemo() {
  return (
    <section className="px-6 py-24 bg-[#000000]" id="demo">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="animate-fade-in-up">
          <p className="font-mono text-[10px] text-violet-400/50 mb-3 tracking-widest">SPEED IS THE FEATURE</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-5 text-white">Every action is one keystroke away.</h2>
          <p className="text-slate-400 leading-relaxed mb-8 text-[14px]">No modal maze. No five-click hierarchy. Baseline is built for people who plan for a living and don&apos;t want to fight the tool while they do it.</p>
          
          <div className="space-y-2">
            {[
              { key: '⌘K', label: 'Jump to any project, task, or report', accent: true },
              { key: '⌘⏎', label: 'Save a baseline and log it, instantly', accent: false },
              { key: 'R', label: 'Open the risk register from anywhere', accent: false },
            ].map(({ key, label, accent }) => (
              <div key={key} className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-all ${
                accent 
                  ? 'border-violet-500/20 bg-violet-500/[0.04] hover:border-violet-500/35 hover:bg-violet-500/[0.07]' 
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]'
              }`}>
                <span className={`font-mono border border-b-2 rounded px-2 py-0.5 text-[11px] shrink-0 ${
                  accent ? 'bg-violet-500/10 text-violet-300/80 border-violet-500/25' : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                }`}>{key}</span>
                <span className="text-[13px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-px animate-fade-in-up" style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.2), rgba(79,70,229,0.08), transparent)', animationDelay: '0.2s' }}>
          <div className="rounded-[11px] bg-[#0A0A0C] p-5">
            <div className="rounded-lg bg-white/[0.03] border border-violet-500/10 p-3 mb-3 flex items-center gap-2">
              <span className="text-violet-400/60 text-[13px] italic">⌘K</span>
              <span className="text-[13px] text-slate-400 font-mono">reschedule migration...</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] bg-violet-500/[0.08] border border-violet-500/15 text-white">
                <span>Move &quot;Data migration&quot; +3 days</span>
                <span className="text-[11px] text-violet-400/60 font-mono">↵</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] border border-transparent text-slate-500 hover:bg-white/[0.03] transition-colors">
                <span>Reassign to critical resource</span>
                <span className="text-[11px] text-slate-600 font-mono">↵</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] border border-transparent text-slate-500 hover:bg-white/[0.03] transition-colors">
                <span>Notify affected owners</span>
                <span className="text-[11px] text-slate-600 font-mono">↵</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
