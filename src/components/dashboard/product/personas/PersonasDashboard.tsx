'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { Persona } from '@/lib/product-strategy/types'
import { getPersonas, deletePersona } from '@/lib/product-strategy/actions'
import { PersonaCard } from './PersonaCard'
import { PersonaBuilderModal } from './PersonaBuilderModal'
import { createClient } from '@/utils/supabase/client'
import { Plus, Users, Filter, Search, Loader2 } from 'lucide-react'

interface PersonasDashboardProps {
  organizationId: string
  projectId?: string
  hasEditAccess?: boolean
}

export function PersonasDashboard({ organizationId, projectId, hasEditAccess = true }: PersonasDashboardProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterScope, setFilterScope] = useState<'all' | 'project' | 'shared'>('all')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)

  const fetchPersonas = useCallback(async () => {
    setLoading(true)
    const data = await getPersonas(organizationId, projectId)
    setPersonas(data)
    setLoading(false)
  }, [organizationId, projectId])

  useEffect(() => {
    fetchPersonas()
  }, [fetchPersonas])

  // Realtime subscription using clean sync pattern and randomized topic to avoid collision errors
  useEffect(() => {
    const supabase = createClient()
    const topicHash = Math.random().toString(36).substring(2, 8)
    const channel = supabase
      .channel(`personas_sync:${organizationId}_${topicHash}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'personas',
        filter: `organization_id=eq.${organizationId}`
      }, () => {
        fetchPersonas()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, fetchPersonas])

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Persona? This action cannot be undone.')) {
      setPersonas(prev => prev.filter(p => p.id !== id))
      await deletePersona(id, projectId)
    }
  }

  const handleCreateNew = () => {
    setEditingPersona(null)
    setIsModalOpen(true)
  }

  const handleSaved = (savedPersona: Persona) => {
    setPersonas(prev => {
      const exists = prev.find(p => p.id === savedPersona.id)
      if (exists) {
        return prev.map(p => p.id === savedPersona.id ? savedPersona : p)
      }
      return [savedPersona, ...prev]
    })
  }

  // Filtering & Search
  const filteredPersonas = personas.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.role_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.jtbd_statement && p.jtbd_statement.toLowerCase().includes(searchTerm.toLowerCase()))
    
    if (!matchesSearch) return false

    if (filterScope === 'project') return p.project_id === projectId
    if (filterScope === 'shared') return p.project_id === null
    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500 text-white rounded-lg shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Customer Personas & Empathy Maps
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define user behaviors, Jobs-To-Be-Done, and core frustrations guiding product delivery.
            </p>
          </div>
        </div>

        {hasEditAccess && (
          <button
            type="button"
            onClick={handleCreateNew}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow hover:shadow-md transition-all duration-150 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Persona
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, role, or JTBD..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {projectId && (
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              style={{ cursor: 'pointer' }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterScope === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Personas
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('project')}
              style={{ cursor: 'pointer' }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterScope === 'project' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Project Scoped
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('shared')}
              style={{ cursor: 'pointer' }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterScope === 'shared' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Org Shared
            </button>
          </div>
        )}
      </div>

      {/* Personas Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mr-3 text-indigo-500" />
          <span className="text-sm font-medium">Loading target customer personas...</span>
        </div>
      ) : filteredPersonas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No customer personas found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            {searchTerm || filterScope !== 'all'
              ? 'Try adjusting your search query or scope filter to view existing personas.'
              : 'Create your first customer persona or empathy map to establish clear user alignment for project deliverables.'}
          </p>
          {hasEditAccess && !searchTerm && filterScope === 'all' && (
            <button
              type="button"
              onClick={handleCreateNew}
              style={{ cursor: 'pointer' }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Persona
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersonas.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={handleEdit}
              onDelete={handleDelete}
              hasEditAccess={hasEditAccess}
            />
          ))}
        </div>
      )}

      {/* Builder Modal */}
      <PersonaBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        organizationId={organizationId}
        projectId={projectId}
        existingPersona={editingPersona}
      />
    </div>
  )
}
