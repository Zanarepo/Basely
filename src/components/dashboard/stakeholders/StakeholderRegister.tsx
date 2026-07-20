'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, User, Building, Trash2, Mail, Phone, ExternalLink, Search } from 'lucide-react'

type Stakeholder = {
  id: string
  name: string
  role_title: string | null
  organization_type: 'internal' | 'external'
  sub_category: string | null
  email: string | null
  phone: string | null
  influence: number | null
  interest: number | null
  communication_preference: string | null
  linked_user_id: string | null
  profiles?: { full_name: string | null; email: string | null }
}

type StakeholderRegisterProps = {
  projectId: string
  hasEditAccess: boolean
  onEdit: (id: string) => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function StakeholderRegister({ projectId, hasEditAccess, onEdit, onShowToast }: StakeholderRegisterProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  
  // Filters
  const [orgTypeFilter, setOrgTypeFilter] = useState<'all' | 'internal' | 'external'>('all')
  const [minInfluence, setMinInfluence] = useState<number>(1)
  const [minInterest, setMinInterest] = useState<number>(1)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  const loadStakeholders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*, profiles(full_name, email)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load stakeholders:', error)
    } else {
      setStakeholders(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadStakeholders()

    // Realtime subscription
    const channel = supabase
      .channel('stakeholders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stakeholders',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // When a change happens, reload the list to get joined profile data easily
          loadStakeholders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter(s => {
      if (orgTypeFilter !== 'all' && s.organization_type !== orgTypeFilter) return false
      if (s.influence && s.influence < minInfluence) return false
      if (s.interest && s.interest < minInterest) return false
      
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const nameMatch = (s.profiles?.full_name || s.name).toLowerCase().includes(query)
        const emailMatch = (s.profiles?.email || s.email || '').toLowerCase().includes(query)
        const roleMatch = (s.role_title || '').toLowerCase().includes(query)
        
        if (!nameMatch && !emailMatch && !roleMatch) return false
      }
      
      return true
    })
  }, [stakeholders, orgTypeFilter, minInfluence, minInterest, searchQuery])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStakeholders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStakeholders.map(s => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !hasEditAccess) return
    const confirm = window.confirm(`Are you sure you want to remove ${selectedIds.size} stakeholders?`)
    if (!confirm) return

    setDeleting(true)
    const { error } = await supabase
      .from('stakeholders')
      .delete()
      .in('id', Array.from(selectedIds))
    
    if (error) {
      console.error(error)
      onShowToast('error', `Failed to delete stakeholders: ${error.message}`)
    } else {
      setStakeholders(prev => prev.filter(s => !selectedIds.has(s.id)))
      setSelectedIds(new Set())
      onShowToast('success', `Deleted ${selectedIds.size} stakeholders`)
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-app-muted" />
      </div>
    )
  }

  return (
    <div className="bg-app-surface-solid rounded-2xl border border-app-border overflow-hidden shadow-sm">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap gap-4 p-4 border-b border-app-border items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-app-subtle font-medium">Type:</span>
            <select
              value={orgTypeFilter}
              onChange={(e) => setOrgTypeFilter(e.target.value as any)}
              className="text-sm bg-app-surface border border-app-border rounded-lg px-2 py-1 text-app-fg"
            >
              <option value="all">All</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-app-subtle font-medium">Min Influence:</span>
            <select
              value={minInfluence}
              onChange={(e) => setMinInfluence(Number(e.target.value))}
              className="text-sm bg-app-surface border border-app-border rounded-lg px-2 py-1 text-app-fg"
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-app-subtle font-medium">Min Interest:</span>
            <select
              value={minInterest}
              onChange={(e) => setMinInterest(Number(e.target.value))}
              className="text-sm bg-app-surface border border-app-border rounded-lg px-2 py-1 text-app-fg"
            >
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 relative ml-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
            <input
              type="text"
              placeholder="Search name, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm bg-app-surface border border-app-border rounded-lg pl-9 pr-3 py-1.5 text-app-fg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </div>
        </div>

        {selectedIds.size > 0 && hasEditAccess && (
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-sm font-semibold rounded-lg transition-colors"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete {selectedIds.size} Selected
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-app-surface border-b border-app-border text-app-subtle">
            <tr>
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredStakeholders.length && filteredStakeholders.length > 0}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer"
                />
              </th>
              <th className="p-4 text-xs font-semibold text-app-subtle uppercase tracking-wider">Name & Role</th>
              <th className="p-4 text-xs font-semibold text-app-subtle uppercase tracking-wider">Type</th>
              <th className="p-4 text-xs font-semibold text-app-subtle uppercase tracking-wider">Contact</th>
              <th className="p-4 text-xs font-semibold text-app-subtle uppercase tracking-wider text-center">Influence</th>
              <th className="p-4 text-xs font-semibold text-app-subtle uppercase tracking-wider text-center">Interest</th>
              <th className="p-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {filteredStakeholders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-app-muted">
                  No stakeholders found matching the filters.
                </td>
              </tr>
            ) : (
              filteredStakeholders.map((s) => {
                // If linked, dynamically prefer the profile's data
                const displayName = s.linked_user_id && s.profiles?.full_name ? s.profiles.full_name : s.name
                const displayEmail = s.linked_user_id && s.profiles?.email ? s.profiles.email : s.email

                return (
                  <tr key={s.id} className="hover:bg-app-hover group transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className={`w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer transition-opacity duration-200 ${selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${s.organization_type === 'internal' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {s.organization_type === 'internal' ? <User className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-app-fg text-sm flex items-center gap-1.5">
                            {displayName}
                            {s.linked_user_id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" title="Linked to Platform User">Linked</span>
                            )}
                          </p>
                          <p className="text-xs text-app-subtle">{s.role_title || 'No role specified'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium capitalize text-app-fg">{s.organization_type}</span>
                        {s.sub_category && <span className="text-xs text-app-subtle">{s.sub_category}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {displayEmail && (
                          <a href={`mailto:${displayEmail}`} className="flex items-center gap-1.5 text-xs text-app-subtle hover:text-indigo-500">
                            <Mail className="h-3 w-3" /> {displayEmail}
                          </a>
                        )}
                        {s.phone && (
                          <span className="flex items-center gap-1.5 text-xs text-app-subtle">
                            <Phone className="h-3 w-3" /> {s.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm font-bold text-app-fg">
                      {s.influence || '-'}
                    </td>
                    <td className="p-4 text-center text-sm font-bold text-app-fg">
                      {s.interest || '-'}
                    </td>
                    <td className="p-4 text-right">
                      {hasEditAccess && (
                        <button
                          onClick={() => onEdit(s.id)}
                          className="p-2 text-app-muted hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-indigo-500/10"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
