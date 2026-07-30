'use client'

import { ProductBacklogItem } from '@/lib/product-strategy/types'

type EffortImpactScatterPlotProps = {
  items: ProductBacklogItem[]
}

export function EffortImpactScatterPlot({ items }: EffortImpactScatterPlotProps) {
  // We'll plot Impact (Y) vs Effort (X). Both typically 1-10.
  // This is a simple CSS-based scatter plot.
  
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Effort vs. Impact</h3>
          <p className="text-sm text-slate-500">Visualize quick wins and major projects</p>
        </div>
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Quick Wins
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Major Projects
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span> Fill-ins
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span> Thankless Tasks
          </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="relative w-full h-[400px] border-l-2 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 rounded-tr-xl">
        {/* Quadrant lines */}
        <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-slate-200 dark:border-slate-700"></div>
        <div className="absolute left-0 right-0 top-1/2 border-b-2 border-dashed border-slate-200 dark:border-slate-700"></div>
        
        {/* Axes Labels */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-slate-500 tracking-wider uppercase">
          Impact
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-semibold text-slate-500 tracking-wider uppercase">
          Effort
        </div>
        
        {/* Quadrant Labels */}
        <div className="absolute top-4 left-4 text-xs font-bold text-emerald-500/50 uppercase tracking-widest pointer-events-none">Quick Wins</div>
        <div className="absolute top-4 right-4 text-xs font-bold text-indigo-500/50 uppercase tracking-widest pointer-events-none">Major Projects</div>
        <div className="absolute bottom-4 left-4 text-xs font-bold text-amber-500/50 uppercase tracking-widest pointer-events-none">Fill-ins</div>
        <div className="absolute bottom-4 right-4 text-xs font-bold text-rose-500/50 uppercase tracking-widest pointer-events-none">Thankless Tasks</div>

        {/* Plot points */}
        {items.map(item => {
          // Normalize coordinates (assuming values mostly 1-10)
          // X = Effort (0 to 100%)
          const xPos = Math.min(Math.max((item.effort / 10) * 100, 5), 95)
          // Y = Impact (0 to 100%, bottom is 0)
          const yPos = Math.min(Math.max((item.impact / 10) * 100, 5), 95)
          
          let color = 'bg-slate-500'
          if (item.impact >= 5 && item.effort < 5) color = 'bg-emerald-500' // High Impact, Low Effort
          else if (item.impact >= 5 && item.effort >= 5) color = 'bg-indigo-500' // High Impact, High Effort
          else if (item.impact < 5 && item.effort < 5) color = 'bg-amber-500' // Low Impact, Low Effort
          else if (item.impact < 5 && item.effort >= 5) color = 'bg-rose-500' // Low Impact, High Effort

          return (
            <div
              key={item.id}
              className={`absolute w-6 h-6 -ml-3 -mb-3 rounded-full ${color} text-white flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer hover:scale-125 hover:z-10 transition-transform group`}
              style={{ left: `${xPos}%`, bottom: `${yPos}%` }}
              title={item.title}
            >
              {item.title.substring(0, 1)}
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-20 pointer-events-none">
                <div className="font-semibold mb-1 truncate">{item.title}</div>
                <div className="flex justify-between text-slate-300">
                  <span>Impact: {item.impact}</span>
                  <span>Effort: {item.effort}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
