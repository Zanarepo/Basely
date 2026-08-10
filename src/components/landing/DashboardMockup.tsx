import { Calendar, DollarSign, Activity, Settings2 } from 'lucide-react'

export function DashboardMockup() {
  return (
    <div className="w-full rounded-2xl bg-app-surface-solid border border-app-border overflow-hidden shadow-2xl flex flex-col font-sans">
      {/* App Header Bar (Mock) */}
      <div className="h-12 border-b border-app-border flex items-center px-4 gap-4 bg-app-card">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
        </div>
        <div className="h-6 flex-1 rounded-md bg-app-input border border-app-border/50 max-w-sm mx-auto flex items-center justify-center text-xs text-app-muted font-mono">
          baseline.app / dashboard / Q3-Migration
        </div>
      </div>

      <div className="p-6 md:p-8 bg-app-bg flex-1 space-y-6">
        
        {/* RAG Status Bar */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div>
              <h3 className="text-emerald-500 font-semibold text-lg">RAG Status: Project on Track (Green)</h3>
              <p className="text-sm text-app-muted">Schedule milestones and budget thresholds are matching target baselines.</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
              <Activity className="w-4 h-4" /> Activity Log
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-app-border bg-app-surface text-app-fg hover:bg-app-hover transition-colors">
              <Settings2 className="w-4 h-4" /> Sync Live Data
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Schedule Health */}
          <div className="rounded-xl border border-app-border bg-app-card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-semibold text-app-fg">Schedule Health</h4>
              <Calendar className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="97, 100" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-app-fg">97%</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-1">Critical Path Status</p>
                <div className="flex items-center gap-2 font-semibold text-app-fg mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> On Track
                </div>
                <p className="text-sm text-emerald-500">No schedule slippage</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <div className="text-emerald-500 font-bold text-xl mb-1">12</div>
                <div className="text-[10px] font-semibold text-emerald-500/80 uppercase">Hit</div>
              </div>
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-center">
                <div className="text-rose-500 font-bold text-xl mb-1">1</div>
                <div className="text-[10px] font-semibold text-rose-500/80 uppercase">Missed</div>
              </div>
              <div className="rounded-lg bg-app-surface border border-app-border p-3 text-center">
                <div className="text-app-fg font-bold text-xl mb-1">4</div>
                <div className="text-[10px] font-semibold text-app-muted uppercase">Pending</div>
              </div>
            </div>
          </div>

          {/* Cost & EVM Health */}
          <div className="rounded-xl border border-app-border bg-app-card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-semibold text-app-fg">Cost & EVM Health</h4>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-app-surface border border-app-border p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-app-muted">CPI</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                </div>
                <div className="text-2xl font-bold text-app-fg">1.08</div>
                <div className="text-[10px] text-emerald-500 mt-1">Efficient ($1.08 / $1)</div>
              </div>
              <div className="rounded-lg bg-app-surface border border-app-border p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-app-muted">SPI</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                </div>
                <div className="text-2xl font-bold text-app-fg">1.04</div>
                <div className="text-[10px] text-emerald-500 mt-1">4% ahead of schedule</div>
              </div>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">Budget at Completion (BAC):</span>
                <span className="font-mono text-app-fg font-semibold">$120,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-app-muted">Estimate at Completion (EAC):</span>
                <span className="font-mono text-indigo-400 font-semibold">$110,769</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-app-border">
                <span className="text-app-muted">Variance at Completion (VAC):</span>
                <span className="font-mono text-emerald-500 font-semibold">+$9,231</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-app-border pt-4">
              <div className="text-center">
                <div className="text-[10px] font-semibold text-app-muted uppercase mb-1">Planned (PV)</div>
                <div className="font-mono text-sm text-app-fg">$50.0k</div>
              </div>
              <div className="text-center border-l border-r border-app-border">
                <div className="text-[10px] font-semibold text-app-muted uppercase mb-1">Earned (EV)</div>
                <div className="font-mono text-sm text-indigo-400">$52.0k</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-semibold text-app-muted uppercase mb-1">Actual (AC)</div>
                <div className="font-mono text-sm text-emerald-500">$48.0k</div>
              </div>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="rounded-xl border border-app-border bg-app-card p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-semibold text-app-fg">Upcoming Milestones</h4>
              <Activity className="w-5 h-5 text-rose-500" />
            </div>
            
            <div className="space-y-3">
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 flex gap-3 items-start">
                <div className="mt-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-app-fg leading-tight">Design the Login page</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 uppercase tracking-wide">Missed</span>
                  </div>
                  <p className="text-xs text-app-muted mt-1">Jul 24, 2026</p>
                </div>
              </div>
              
              <div className="rounded-lg border border-app-border bg-app-surface p-3 flex gap-3 items-start opacity-70">
                <div className="mt-1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-app-fg leading-tight">Schema Architecture</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-app-border text-app-muted uppercase tracking-wide">Done</span>
                  </div>
                  <p className="text-xs text-app-muted mt-1">Aug 01, 2026</p>
                </div>
              </div>

              <div className="rounded-lg border border-app-border bg-app-surface p-3 flex gap-3 items-start">
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-indigo-500"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-app-fg leading-tight">API Integration</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase tracking-wide">Next</span>
                  </div>
                  <p className="text-xs text-app-muted mt-1">Aug 15, 2026</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
