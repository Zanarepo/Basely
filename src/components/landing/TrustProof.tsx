import { TrendingDown, Timer, FileSpreadsheet, ShieldCheck } from 'lucide-react'

export function TrustProof() {
  return (
    <section className="relative px-6 py-32 bg-black overflow-hidden" id="proof">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto z-10">
        <p className="text-center text-xs font-bold text-slate-500 mb-12 tracking-[0.25em] uppercase">
          Trusted by Delivery Teams At
        </p>
        
        {/* Logos */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-32">
          {['Northbeam', 'Calder & Vine', 'Ashgrove', 'Reliant Partners', 'Marrow Studio'].map((name) => (
            <span key={name} className="font-bold text-xl md:text-3xl text-white opacity-20 tracking-tighter hover:opacity-60 transition-opacity cursor-default mix-blend-plus-lighter">
              {name}
            </span>
          ))}
        </div>
        
        {/* Dynamic Glassmorphism Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              stat: '38%', 
              label: 'fewer missed baselines in the first quarter', 
              icon: TrendingDown,
            },
            { 
              stat: '<5m', 
              label: 'to import a WBS and get a working critical path', 
              icon: Timer,
            },
            { 
              stat: '0', 
              label: 'spreadsheets needed to reconcile schedule', 
              icon: FileSpreadsheet,
            },
            { 
              stat: '100%', 
              label: 'generated reports match live project data', 
              icon: ShieldCheck,
            },
          ].map(({ stat, label, icon: Icon }, i) => (
            <div 
              key={stat} 
              className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl hover:shadow-violet-900/40 overflow-hidden flex flex-col justify-between min-h-[280px]"
            >
              {/* Subtle animated gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 group-hover:bg-violet-500/30 border border-white/20 group-hover:border-violet-500/40 flex items-center justify-center mb-8 transition-all duration-500">
                  <Icon className="w-6 h-6 text-slate-400 group-hover:text-violet-300 transition-colors duration-500" />
                </div>
                
                <p className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-4 group-hover:text-violet-200 transition-all duration-500">
                  {stat}
                </p>
                <p className="text-sm font-medium text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-500">
                  {label}
                </p>
              </div>

              {/* Decorative background icon */}
              <Icon 
                className="absolute -bottom-6 -right-6 w-40 h-40 text-white -rotate-12 transition-all duration-700 pointer-events-none group-hover:scale-110" 
                strokeWidth={1}
                style={{ opacity: 0.03 }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
