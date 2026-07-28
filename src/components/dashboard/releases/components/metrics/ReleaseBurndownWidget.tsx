import { TrendingDown } from 'lucide-react'
import { getTerminology } from '@/utils/terminology'

export default function ReleaseBurndownWidget({
  data,
  methodology
}: {
  data: Array<{ name: string; remaining: number; target: number }>
  methodology: string
}) {
  const terms = getTerminology(methodology)
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center h-full min-h-[300px]">
        <TrendingDown className="h-8 w-8 text-app-muted mb-2 opacity-50" />
        <span className="text-sm text-app-muted">No burn-down data available for this release.</span>
      </div>
    )
  }

  // Find max values to scale the SVG
  const maxPoints = Math.max(...data.map(d => Math.max(d.remaining, d.target)))
  const width = 400
  const height = 200
  const paddingX = 40
  const paddingY = 20

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (data.length - 1)) * (width - 2 * paddingX)
    const y = height - paddingY - (val / (maxPoints || 1)) * (height - 2 * paddingY)
    return { x, y }
  }

  const targetPath = data.map((d, i) => {
    const { x, y } = getCoordinates(i, d.target)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const remainingPath = data.map((d, i) => {
    const { x, y } = getCoordinates(i, d.remaining)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-app-fg">Burn-down Chart</h3>
          <p className="text-xs text-app-muted">Tracking work remaining across {terms.iterations.toLowerCase()}</p>
        </div>
        <TrendingDown className="h-5 w-5 text-indigo-500" />
      </div>

      <div className="relative w-full h-[220px] flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = height - paddingY - pct * (height - 2 * paddingY)
            return (
              <g key={`y-${pct}`}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="currentColor" className="text-app-border opacity-50" strokeDasharray="4 4" />
                <text x={paddingX - 10} y={y + 4} textAnchor="end" className="fill-app-muted text-[10px] font-medium">
                  {Math.round(pct * maxPoints)}
                </text>
              </g>
            )
          })}
          
          {/* Target Line */}
          <path d={targetPath} fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 dark:text-gray-700" strokeDasharray="4 4" />
          
          {/* Remaining Line */}
          <path d={remainingPath} fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-500 drop-shadow-sm" />

          {/* Data Points */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, d.remaining)
            return (
              <circle key={`pt-${i}`} cx={x} cy={y} r="4" fill="currentColor" className="text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer" />
            )
          })}
          
          {/* X Axis Labels */}
          {data.map((d, i) => {
            const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX)
            return (
              <text key={`x-${i}`} x={x} y={height} textAnchor="middle" className="fill-app-muted text-[10px] font-medium">
                {d.name}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-gray-300 dark:bg-gray-700" />
          <span className="text-[10px] text-app-muted font-bold uppercase tracking-wider">Target Base</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-indigo-500 rounded-full" />
          <span className="text-[10px] text-app-muted font-bold uppercase tracking-wider">Actual Remaining</span>
        </div>
      </div>
    </div>
  )
}
