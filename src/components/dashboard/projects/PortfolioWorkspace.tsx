'use client'

import { useState, useMemo } from 'react'
import { Loader2, AlertCircle, RefreshCw, ArrowUpDown, ChevronRight } from 'lucide-react'
import { usePortfolioData, type PortfolioProjectInput } from './hooks/usePortfolioData'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import Link from 'next/link'

export default function PortfolioWorkspace({
  projects
}: {
  projects: PortfolioProjectInput[]
}) {
  const {
    loading,
    error,
    projectRows,
    aggregates,
    refresh
  } = usePortfolioData(projects)

  // Filters & Sorting States
  const [ragFilter, setRagFilter] = useState<'All' | 'Red' | 'Amber' | 'Green'>('All')
  const [sortBy, setSortBy] = useState<'name' | 'cpi' | 'spi' | 'progress'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Apply filters & sorting in memory
  const processedRows = useMemo(() => {
    let result = [...projectRows]

    // 1. RAG status filtering
    if (ragFilter !== 'All') {
      result = result.filter(r => r.ragStatus === ragFilter)
    }

    // 2. Sorting
    result.sort((a, b) => {
      let valA: string | number | null = 0
      let valB: string | number | null = 0

      if (sortBy === 'progress') {
        valA = a.overallPercentComplete
        valB = b.overallPercentComplete
      } else if (sortBy === 'cpi') {
        valA = a.cpi
        valB = b.cpi
      } else if (sortBy === 'spi') {
        valA = a.spi
        valB = b.spi
      } else {
        valA = a.name
        valB = b.name
      }

      // Handle nulls in CPI / SPI
      if (valA === null) valA = sortOrder === 'asc' ? 999999 : -999999
      if (valB === null) valB = sortOrder === 'asc' ? 999999 : -999999

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      } else {
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number)
      }
    })

    return result
  }, [projectRows, ragFilter, sortBy, sortOrder])

  const toggleSort = (field: 'name' | 'cpi' | 'spi' | 'progress') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc') // Default to desc for performance values
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-app-subtle">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Analyzing portfolio metrics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] border border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900/50 rounded-3xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <span className="text-sm font-semibold text-red-800 dark:text-red-400 mt-4">Failed to load portfolio</span>
        <span className="text-xs text-red-600 dark:text-red-500 mt-2 max-w-md">{error}</span>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/25 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Aggregates Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Rollup */}
        <div className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1">Portfolio Budget</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
            <CurrencyDisplay amount={aggregates.totalBudget} currency="USD" compactThreshold={100000} />
          </div>
        </div>

        {/* Total Spend Rollup */}
        <div className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1">Actual Spend</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
            <CurrencyDisplay amount={aggregates.totalSpend} currency="USD" compactThreshold={100000} />
          </div>
        </div>

        {/* Project RAG Counts */}
        <div className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm sm:col-span-2 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider">Workspace Health Distribution</div>
            <div className="text-xs text-app-subtle">Aggregated status of {projectRows.length} active projects</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 rounded-xl px-3 py-1.5 min-w-[50px]">
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">{aggregates.redCount}</span>
              <span className="text-[8px] font-extrabold uppercase tracking-wide text-rose-500">Red</span>
            </div>
            <div className="flex flex-col items-center bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 rounded-xl px-3 py-1.5 min-w-[50px]">
              <span className="text-sm font-black text-amber-600 dark:text-amber-400">{aggregates.amberCount}</span>
              <span className="text-[8px] font-extrabold uppercase tracking-wide text-amber-500">Amber</span>
            </div>
            <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 rounded-xl px-3 py-1.5 min-w-[50px]">
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{aggregates.greenCount}</span>
              <span className="text-[8px] font-extrabold uppercase tracking-wide text-emerald-500">Green</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Sorts, and Sync Button */}
      <div className="bg-white dark:bg-app-surface border border-app-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* RAG Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-app-muted font-bold uppercase tracking-wider mr-2">Filter RAG:</span>
          {(['All', 'Green', 'Amber', 'Red'] as const).map(f => (
            <button
              key={f}
              onClick={() => setRagFilter(f)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                ragFilter === f
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/35 dark:text-indigo-400 shadow-sm'
                  : 'bg-white border-app-border text-app-fg hover:bg-gray-50 dark:bg-app-surface dark:hover:bg-app-hover'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sync Button */}
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-app-surface text-app-fg border border-app-border rounded-xl hover:bg-gray-50 dark:hover:bg-app-hover text-xs font-bold shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Rollup
        </button>
      </div>

      {/* Projects Portfolio Grid/List Layout */}
      {processedRows.length === 0 ? (
        <div className="bg-white dark:bg-app-surface border border-app-border border-dashed rounded-3xl p-12 text-center text-app-muted">
          No projects matching the selected filter query criteria.
        </div>
      ) : (
        <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl overflow-hidden shadow-sm">
          {/* Desktop Table view (MD screen and larger) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 dark:bg-app-muted-surface border-b border-app-border text-xs font-bold text-app-muted uppercase tracking-wider select-none">
                <tr>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 cursor-pointer hover:text-app-fg transition-colors" onClick={() => toggleSort('name')}>
                    <span className="flex items-center gap-1.5">
                      Project Container
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </span>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:text-app-fg transition-colors" onClick={() => toggleSort('progress')}>
                    <span className="flex items-center gap-1.5">
                      Progress
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </span>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:text-app-fg transition-colors" onClick={() => toggleSort('cpi')}>
                    <span className="flex items-center gap-1.5">
                      CPI
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </span>
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:text-app-fg transition-colors" onClick={() => toggleSort('spi')}>
                    <span className="flex items-center gap-1.5">
                      SPI
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </span>
                  </th>
                  <th className="py-4 px-6 text-right">EAC / BAC</th>
                  <th className="py-4 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {processedRows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-app-hover/50 transition-colors group">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                        row.ragStatus === 'Red'
                          ? 'bg-rose-50 text-rose-600 border-rose-500/25 dark:bg-rose-500/10'
                          : row.ragStatus === 'Amber'
                            ? 'bg-amber-50 text-amber-600 border-amber-500/25 dark:bg-amber-500/10'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-500/25 dark:bg-emerald-500/10'
                      }`}>
                        {row.ragStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-app-fg leading-tight">{row.name}</div>
                      {row.clientName && <div className="text-xs text-app-muted mt-0.5">{row.clientName}</div>}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-app-fg text-xs">{row.overallPercentComplete}%</span>
                        <div className="w-16 bg-gray-100 dark:bg-app-hover rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${row.overallPercentComplete}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`font-extrabold text-sm ${
                        row.cpi === null ? 'text-app-muted' : row.cpi >= 1.0 ? 'text-emerald-500' : row.cpi >= 0.9 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {row.cpi !== null ? row.cpi.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`font-extrabold text-sm ${
                        row.spi === null ? 'text-app-muted' : row.spi >= 1.0 ? 'text-emerald-500' : row.spi >= 0.9 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {row.spi !== null ? row.spi.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="font-extrabold text-indigo-500">
                        <CurrencyDisplay amount={row.eac} currency={row.currency} compactThreshold={1000} />
                      </div>
                      <div className="text-[10px] text-app-muted font-semibold mt-0.5">
                        BAC: <CurrencyDisplay amount={row.bac} currency={row.currency} compactThreshold={1000} />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/projects/${row.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-app-muted hover:text-indigo-500 transition-colors"
                      >
                        Drill Down
                        <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tablet & Mobile Card List view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:hidden">
            {processedRows.map(row => (
              <Link
                key={row.id}
                href={`/dashboard/projects/${row.id}`}
                className="bg-gray-50 dark:bg-app-hover border border-app-border rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-indigo-500 transition-colors group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      row.ragStatus === 'Red'
                        ? 'bg-rose-50 text-rose-600 border-rose-500/25 dark:bg-rose-500/10'
                        : row.ragStatus === 'Amber'
                          ? 'bg-amber-50 text-amber-600 border-amber-500/25 dark:bg-amber-500/10'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-500/25 dark:bg-emerald-500/10'
                    }`}>
                      {row.ragStatus}
                    </span>
                    <ChevronRight className="h-4 w-4 text-app-muted group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h4 className="font-bold text-app-fg text-base leading-tight mb-1">{row.name}</h4>
                  {row.clientName && <p className="text-xs text-app-muted">{row.clientName}</p>}
                </div>

                <div className="space-y-2 border-t border-app-border/40 pt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-app-muted">Progress:</span>
                    <span className="font-bold text-app-fg">{row.overallPercentComplete}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-app-muted">CPI / SPI:</span>
                    <div className="flex gap-2">
                      <span className={`font-extrabold ${
                        row.cpi === null ? 'text-app-muted' : row.cpi >= 1.0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        CPI {row.cpi !== null ? row.cpi.toFixed(2) : '—'}
                      </span>
                      <span className={`font-extrabold ${
                        row.spi === null ? 'text-app-muted' : row.spi >= 1.0 ? 'text-emerald-500' : row.spi >= 0.9 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        SPI {row.spi !== null ? row.spi.toFixed(2) : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-app-muted">EAC:</span>
                    <span className="font-extrabold text-indigo-500">
                      <CurrencyDisplay amount={row.eac} currency={row.currency} compactThreshold={1000} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
