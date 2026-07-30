'use client'

import React, { useState } from 'react'
import type { Persona } from '@/lib/product-strategy/types'
import { Trash2, Edit3, User, Briefcase, Target, Frown, Wrench } from 'lucide-react'

interface PersonaCardProps {
  persona: Persona
  onEdit: (persona: Persona) => void
  onDelete: (id: string) => void
  hasEditAccess?: boolean
}

export function PersonaCard({ persona, onEdit, onDelete, hasEditAccess = true }: PersonaCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Band */}
      <div>
        <div 
          className="h-3 w-full"
          style={{ backgroundColor: persona.avatar_color || '#6366f1' }}
        />
        
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0"
                style={{ backgroundColor: persona.avatar_color || '#6366f1' }}
              >
                {persona.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight">
                  {persona.name}
                </h3>
                <span className="inline-flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {persona.role_title}
                </span>
              </div>
            </div>

            {/* Hover-activated Action Buttons */}
            {hasEditAccess && (
              <div 
                className={`flex items-center space-x-1 transition-opacity duration-200 ${
                  isHovered ? 'opacity-100' : 'opacity-0 focus-within:opacity-100'
                }`}
              >
                <button
                  onClick={() => onEdit(persona)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  style={{ cursor: 'pointer' }}
                  title="Edit Persona"
                  type="button"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(persona.id)}
                  className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  style={{ cursor: 'pointer' }}
                  title="Delete Persona"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Demographics tag */}
          {persona.demographics && (
            <div className="mt-3 inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full font-medium">
              {persona.demographics}
            </div>
          )}

          {/* Jobs to be Done */}
          {persona.jtbd_statement && (
            <div className="mt-4 p-3 bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-lg">
              <span className="block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                Jobs To Be Done (JTBD)
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-200 font-medium italic">
                "{persona.jtbd_statement}"
              </p>
            </div>
          )}

          {/* Motivations & Pain Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="p-2.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                <Target className="w-3.5 h-3.5 mr-1" />
                Key Motivations
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-3">
                {persona.motivations || 'No motivations documented.'}
              </p>
            </div>

            <div className="p-2.5 rounded bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
                <Frown className="w-3.5 h-3.5 mr-1" />
                Pain Points & Frustrations
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-3">
                {persona.pain_points || 'No pain points documented.'}
              </p>
            </div>
          </div>

          {/* Preferred Tools */}
          {persona.preferred_tools && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <Wrench className="w-3.5 h-3.5 mr-1.5 shrink-0 text-slate-400" />
              <span className="truncate font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                {persona.preferred_tools}
              </span>
            </div>
          )}

          {/* Dynamic Custom Attributes / Document Columns */}
          {persona.custom_attributes && Object.keys(persona.custom_attributes).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              {Object.entries(persona.custom_attributes).map(([k, v]) => (
                <span key={k} className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                  <strong className="text-indigo-900 dark:text-indigo-200">{k}:</strong> {v}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer info */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>{persona.project_id ? 'Project Scoped' : 'Org Shared Persona'}</span>
        <span>Updated {new Date(persona.updated_at || persona.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
