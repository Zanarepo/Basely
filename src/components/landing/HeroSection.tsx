import Link from 'next/link'

function DependencyGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Basic Grid */}
      <div 
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Decorative CPM Paths overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor="#7c3aed" />
            <stop offset="70%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        
        {/* Draw faint dependency paths winding through the grid */}
        <g 
          stroke="url(#grid-fade)" 
          fill="none" 
          strokeWidth="1.5" 
          strokeDasharray="6 6" 
          style={{ animation: 'flow 3s linear infinite' }}
        >
          <path d="M 0 160 L 200 160 L 200 320 L 480 320 L 480 200 L 760 200 L 760 360 L 1200 360" />
          <path d="M 240 440 L 360 440 L 360 600 L 800 600 L 800 480 L 1400 480" />
          <path d="M -100 280 L 120 280 L 120 400 L 400 400 L 400 520 L 680 520 L 680 640" />
          <path d="M 880 120 L 1000 120 L 1000 240 L 1400 240" />
        </g>
        
        {/* Nodes mapped to the paths */}
        <g fill="#000" stroke="#7c3aed" strokeWidth="1.5" className="opacity-50">
          <circle cx="200" cy="160" r="4" />
          <circle cx="200" cy="320" r="4" />
          <circle cx="480" cy="320" r="4" />
          <circle cx="480" cy="200" r="4" />
          <circle cx="760" cy="200" r="4" />
          <circle cx="760" cy="360" r="4" />

          <circle cx="360" cy="440" r="4" />
          <circle cx="360" cy="600" r="4" />
          <circle cx="800" cy="600" r="4" />
          <circle cx="800" cy="480" r="4" />

          <circle cx="120" cy="280" r="4" />
          <circle cx="120" cy="400" r="4" />
          <circle cx="400" cy="400" r="4" />
          <circle cx="400" cy="520" r="4" />
          <circle cx="680" cy="520" r="4" />

          <circle cx="1000" cy="120" r="4" />
          <circle cx="1000" cy="240" r="4" />
        </g>
      </svg>
      
      {/* Masks to blend it into the background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_80%)]" />
    </div>
  )
}

export function HeroSection({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="pt-32 pb-20 px-6 bg-[#000000] relative overflow-hidden" id="product">
      {/* CPM Grid Background Overlay */}
      <DependencyGridBackground />

      {/* Subtle violet/indigo radial glow behind hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(109,40,217,0.12)_0%,rgba(79,70,229,0.06)_40%,transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center mb-14 animate-fade-in-up relative z-10">
        <div className="landing-badge mb-8 mx-auto w-fit bg-white/5 border border-white/10 backdrop-blur-md text-violet-200">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400/80 animate-pulse"></span>
          The modern operating system for professional PMOs
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 text-white drop-shadow-md">
          The single source of truth<br className="hidden sm:block" />
          for your entire{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">project lifecycle.</span>
        </h1>
        
        <p className="text-slate-400 text-[17px] max-w-2xl mx-auto leading-relaxed mb-10 drop-shadow-sm">
          Prazaner unifies your schedule, budget (EVM), and risk register into a mathematically linked engine driven by your work breakdown. No spreadsheet reconciliation. No disjointed documentation.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="landing-btn-primary w-full sm:w-auto shadow-[0_0_20px_rgba(124,58,237,0.3)]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="landing-btn-primary w-full sm:w-auto shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                Start free — no card required
              </Link>
              <a href="#pricing" className="landing-btn-secondary w-full sm:w-auto backdrop-blur-sm">
                Book an Enterprise Demo
              </a>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto rounded-xl p-px bg-gradient-to-b from-violet-500/30 via-indigo-500/10 to-transparent shadow-2xl shadow-violet-900/20 animate-fade-in-up relative z-10 backdrop-blur-sm" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-[11px] bg-[#0A0A0C]/90 overflow-hidden relative">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-[#0A0A0C]/50 relative z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-white/10"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/10"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/10"></span>
            <span className="ml-3 text-[11px] font-mono text-slate-500">parzana.app / atlas-migration / schedule</span>
          </div>
          <div className="p-6 md:p-10 relative">
            {/* Subtle violet glow at center */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(109,40,217,0.08)_0%,transparent_70%)] pointer-events-none" />
            
            <svg viewBox="0 0 760 220" className="w-full h-auto relative z-10">
              {/* Axes */}
              <line x1="40" y1="40" x2="40" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
              <line x1="40" y1="200" x2="720" y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
              
              {/* Critical Path — brand violet */}
              <path d="M 60 170 L 190 170 L 190 110 L 340 110 L 340 60 L 500 60 L 500 130 L 660 130" stroke="url(#criticalPathGrad)" strokeWidth="2" fill="none" style={{ strokeDasharray: 240, strokeDashoffset: 240, animation: 'draw 2.8s ease forwards 0.3s' }} />
              
              {/* Non-critical path */}
              <path d="M 60 170 L 190 170 L 190 150 L 300 150 L 300 175 L 420 175 L 420 155 L 550 155" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="criticalPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Nodes */}
              <circle cx="60" cy="170" r="6" fill="#0A0A0C" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
              <circle cx="190" cy="110" r="6" fill="#0A0A0C" stroke="#7c3aed" strokeWidth="1.5" />
              <circle cx="340" cy="60" r="6" fill="#0A0A0C" stroke="#7c3aed" strokeWidth="1.5" />
              <circle cx="500" cy="130" r="6" fill="#0A0A0C" stroke="#6366f1" strokeWidth="1.5" />
              <circle cx="660" cy="130" r="6" fill="#0A0A0C" stroke="#6366f1" strokeWidth="1.5" />
              
              <text x="60" y="195" fontFamily="monospace" fontSize="10" fill="#555">Discovery</text>
              <text x="175" y="195" fontFamily="monospace" fontSize="10" fill="#555">Data model</text>
              <text x="310" y="45" fontFamily="monospace" fontSize="10" fill="#888">Migration</text>
              <text x="470" y="195" fontFamily="monospace" fontSize="10" fill="#555">QA cutover</text>
              <text x="610" y="115" fontFamily="monospace" fontSize="10" fill="#a78bfa">Go-live · at risk</text>
            </svg>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 pt-4 border-t border-white/[0.04] text-[11px] font-mono relative z-10">
              <span className="flex items-center gap-2 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>Critical path — 0 days float</span>
              <span className="flex items-center gap-2 text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>Non-critical — 6 days float</span>
              <span className="ml-auto text-violet-300/80">Slip on &quot;Migration&quot; delays go-live by 4 days</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes flow { from { stroke-dashoffset: 12; } to { stroke-dashoffset: 0; } }
      `}} />
    </section>
  )
}
