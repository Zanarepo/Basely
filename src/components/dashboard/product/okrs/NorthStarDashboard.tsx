'use client'

import React, { useState, useEffect } from 'react'
import type { ProductKpi } from '@/lib/product-strategy/types'
import { getProductKpis } from '@/lib/product-strategy/actions'
import { KpiScorecard } from './KpiScorecard'
import { KpiBuilderModal } from './KpiBuilderModal'
import { Target, Plus, Loader2, RefreshCw, Compass, TrendingUp } from 'lucide-react'

interface NorthStarDashboardProps {
  organizationId: string
  projectId: string
  hasEditAccess?: boolean
}

export function NorthStarDashboard({
  organizationId,
  projectId,
  hasEditAccess = true
}: NorthStarDashboardProps) {
  const [kpis, setKpis] = useState<ProductKpi[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedKpi, setSelectedKpi] = useState<ProductKpi | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'north_star' | 'growth_levers'>('all')

  const fetchKpis = async (isRef = false) => {
    if (isRef) setRefreshing(true)
    else setLoading(true)
    const data = await getProductKpis(organizationId, projectId)
    setKpis(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    if (organizationId) {
      fetchKpis()
    }
  }, [organizationId, projectId])

  const handleCreate = (e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedKpi(null)
    setIsModalOpen(true)
  }

  const handleEdit = (kpi: ProductKpi) => {
    setSelectedKpi(kpi)
    setIsModalOpen(true)
  }

  const handleDeleted = (deletedId: string) => {
    setKpis(prev => prev.filter(k => k.id !== deletedId))
  }

  const handleUpdated = (updatedKpi: ProductKpi) => {
    setKpis(prev => prev.map(k => k.id === updatedKpi.id ? updatedKpi : k))
  }

  const handleSaved = (savedKpi: ProductKpi) => {
    setKpis(prev => {
      const exists = prev.some(k => k.id === savedKpi.id)
      if (exists) {
        return prev.map(k => k.id === savedKpi.id ? savedKpi : k)
      } else {
        return [savedKpi, ...prev]
      }
    })
  }

  const northStarKpi = kpis.find(k => k.category === 'north_star')
  const growthLevers = kpis.filter(k => k.category !== 'north_star' || k.id !== northStarKpi?.id)

  const filteredLevers = activeFilter === 'north_star'
    ? []
    : growthLevers

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 mb-3">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>NORTH STAR KPI ENGINE & GROWTH TREE</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Quantitative Outcome Driver & Levers
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
              Establish a definitive North Star metric supported by concrete acquisition, activation, and retention growth levers. Updates synchronize continuously across collaborative dashboards and formal strategic document reports.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                fetchKpis(true)
              }}
              disabled={refreshing || loading}
              style={{ cursor: 'pointer' }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
              {refreshing ? 'Syncing...' : 'Sync Levers'}
            </button>

            {hasEditAccess && (
              <button
                type="button"
                onClick={handleCreate}
                style={{ cursor: 'pointer' }}
                className="px-5 py-2.5 rounded-xl bg-[#6b4eff] hover:bg-[#5839ec] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Register Growth KPI
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            style={{ cursor: 'pointer' }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === 'all' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            All Metrics ({kpis.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('north_star')}
            style={{ cursor: 'pointer' }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === 'north_star' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            ⭐ North Star Only ({kpis.filter(k => k.category === 'north_star').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('growth_levers')}
            style={{ cursor: 'pointer' }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === 'growth_levers' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            🚀 Supporting Levers ({kpis.filter(k => k.category !== 'north_star').length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading quantitative growth matrix and levers...
          </span>
        </div>
      ) : kpis.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto my-10 space-y-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No North Star KPIs or Growth Levers Defined Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            Get started by defining your primary North Star outcome (e.g., Weekly Active Corporate Workspaces, Gross Merchandise Value) along with supporting input growth levers.
          </p>
          {hasEditAccess && (
            <button
              type="button"
              onClick={handleCreate}
              style={{ cursor: 'pointer' }}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Register First North Star KPI
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* North Star Section */}
          {activeFilter !== 'growth_levers' && northStarKpi && (
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>⭐ Primary North Star Metric</span>
              </h2>
              <div className="max-w-xl">
                <KpiScorecard
                  kpi={northStarKpi}
                  hasEditAccess={hasEditAccess}
                  onEdit={handleEdit}
                  onDeleted={handleDeleted}
                  onUpdated={handleUpdated}
                />
              </div>
            </div>
          )}

          {/* Growth Levers Grid */}
          {activeFilter !== 'north_star' && filteredLevers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pt-2">
                <span>📈 Supporting Growth Levers & Input KPIs</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLevers.map((kpi) => (
                  <KpiScorecard
                    key={kpi.id}
                    kpi={kpi}
                    hasEditAccess={hasEditAccess}
                    onEdit={handleEdit}
                    onDeleted={handleDeleted}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Builder Modal */}
      <KpiBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organizationId={organizationId}
        projectId={projectId}
        existingKpi={selectedKpi}
        onSaved={handleSaved}
      />
    </div>
  )
}
