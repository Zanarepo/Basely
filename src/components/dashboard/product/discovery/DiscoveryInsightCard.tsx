'use client'

import React, { useState } from 'react'
import type { DiscoveryInsight } from '@/lib/product-strategy/types'
import {
  MessageSquare,
  AlertTriangle,
  ArrowRightLeft,
  Trash2,
  Edit3,
  User,
  Tag,
  TrendingUp,
  Loader2,
  Shield,
  Clock,
  BarChart2
} from 'lucide-react'

interface DiscoveryInsightCardProps {
  insight: DiscoveryInsight
  onEdit: (insight: DiscoveryInsight) => void
  onDelete: (id: string) => void
  onConvertToCR: (id: string) => void
  saving: boolean
  hasEditAccess: boolean
}

const severityConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: { label: 'Low', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-200 dark:border-emerald-800' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30', borderColor: 'border-amber-200 dark:border-amber-800' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30', borderColor: 'border-orange-200 dark:border-orange-800' },
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30', borderColor: 'border-red-200 dark:border-red-800' }
}

const sourceConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  customer_interview: { label: 'Customer Interview', icon: <MessageSquare className="w-3 h-3" /> },
  support_ticket: { label: 'Support Ticket', icon: <AlertTriangle className="w-3 h-3" /> },
  sales_call: { label: 'Sales Call', icon: <TrendingUp className="w-3 h-3" /> },
  user_research: { label: 'User Research', icon: <User className="w-3 h-3" /> },
  survey: { label: 'Survey', icon: <BarChart2 className="w-3 h-3" /> },
  analytics: { label: 'Analytics', icon: <BarChart2 className="w-3 h-3" /> },
  other: { label: 'Other', icon: <Tag className="w-3 h-3" /> }
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-900/30' },
  triaged: { label: 'Triaged', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/30' },
  in_review: { label: 'In Review', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30' },
  converted: { label: 'Converted', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30' },
  archived: { label: 'Archived', color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' }
}

export function DiscoveryInsightCard({ insight, onEdit, onDelete, onConvertToCR, saving, hasEditAccess }: DiscoveryInsightCardProps) {
  const [hovered, setHovered] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sev = severityConfig[insight.severity] || severityConfig.medium
  const src = sourceConfig[insight.source] || sourceConfig.other
  const sts = statusConfig[insight.status] || statusConfig.new

  const handleConvert = async () => {
    setConvertingId(insight.id)
    await onConvertToCR(insight.id)
    setConvertingId(null)
  }

  const handleDelete = async () => {
    setDeletingId(insight.id)
    await onDelete(insight.id)
    setDeletingId(null)
  }

  return (
    <div
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top Row: Title + Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{insight.title}</h3>
          {insight.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{insight.description}</p>
          )}
        </div>

        {/* Hover-only action buttons */}
        {hasEditAccess && (
          <div className={`flex items-center gap-1 shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              type="button"
              onClick={() => onEdit(insight)}
              style={{ cursor: 'pointer' }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors"
              title="Edit Insight"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {insight.status !== 'converted' && (
              <button
                type="button"
                onClick={handleConvert}
                disabled={saving}
                style={{ cursor: 'pointer' }}
                className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                title="Convert to Change Request"
              >
                {convertingId === insight.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                ) : (
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              style={{ cursor: 'pointer' }}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Delete Insight"
            >
              {deletingId === insight.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Severity */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sev.bgColor} ${sev.color} border ${sev.borderColor}`}>
          <Shield className="w-2.5 h-2.5" />
          {sev.label}
        </span>

        {/* Source */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {src.icon}
          {src.label}
        </span>

        {/* Status */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sts.bgColor} ${sts.color}`}>
          {sts.label}
        </span>

        {/* Frequency */}
        {insight.frequency > 1 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
            <Clock className="w-2.5 h-2.5" />
            {insight.frequency}× reported
          </span>
        )}

        {/* Linked Persona */}
        {insight.persona && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <User className="w-2.5 h-2.5" />
            {insight.persona.name}
          </span>
        )}
      </div>
    </div>
  )
}
