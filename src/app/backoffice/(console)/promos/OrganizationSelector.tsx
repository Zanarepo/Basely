'use client'

import { useState, useEffect, useRef } from 'react'
import { searchOrganizations } from '@/lib/backoffice/promos-actions'
import { X, Search, Loader2 } from 'lucide-react'

type Org = { id: string, name: string }

export function OrganizationSelector({
  selectedOrgs,
  onChange
}: {
  selectedOrgs: Org[]
  onChange: (orgs: Org[]) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Org[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const fetchOrgs = async () => {
      setLoading(true)
      const data = await searchOrganizations(query)
      setResults(data || [])
      setLoading(false)
    }
    
    const debounce = setTimeout(fetchOrgs, 300)
    return () => clearTimeout(debounce)
  }, [query, isOpen])

  const handleSelect = (org: Org) => {
    if (!selectedOrgs.find(o => o.id === org.id)) {
      onChange([...selectedOrgs, org])
    }
    setQuery('')
    setIsOpen(false)
  }

  const handleRemove = (id: string) => {
    onChange(selectedOrgs.filter(o => o.id !== id))
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="min-h-[42px] p-1.5 bg-app-surface-solid border border-app-border rounded-lg flex flex-wrap gap-1.5 focus-within:border-indigo-500">
        {selectedOrgs.map(org => (
          <div key={org.id} className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-md text-xs font-medium">
            {org.name}
            <button
              type="button"
              onClick={() => handleRemove(org.id)}
              className="p-0.5 hover:bg-indigo-500/20 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedOrgs.length === 0 ? "Search organizations..." : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none px-2 py-1 text-sm text-app-fg placeholder-app-muted"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-app-surface border border-app-border rounded-lg shadow-lg z-50 py-1">
          {loading ? (
            <div className="p-3 text-center text-sm text-app-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Searching...
            </div>
          ) : results.length > 0 ? (
            results.map(org => (
              <button
                key={org.id}
                type="button"
                onClick={() => handleSelect(org)}
                className="w-full text-left px-3 py-2 text-sm text-app-fg hover:bg-app-hover flex items-center gap-2"
              >
                <Search className="w-3 h-3 text-app-muted" /> {org.name}
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-app-muted">No organizations found.</div>
          )}
        </div>
      )}
    </div>
  )
}
