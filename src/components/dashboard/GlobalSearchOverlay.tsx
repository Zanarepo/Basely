'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, Loader2, Folder, CheckSquare, AlertTriangle, File, X } from 'lucide-react'
import { globalSearch, type GlobalSearchResult } from '@/lib/search/search-actions'

export function GlobalSearchOverlay() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // Debounce search
  const debounceRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      return
    }
    
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const res = await globalSearch(query)
      setResults(res)
      setLoading(false)
    }, 300)

  }, [query, open])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'project': return <Folder className="w-4 h-4 text-blue-500" />
      case 'wbs': return <CheckSquare className="w-4 h-4 text-indigo-500" />
      case 'risk': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'attachment': return <File className="w-4 h-4 text-gray-500" />
      default: return <Search className="w-4 h-4 text-app-muted" />
    }
  }

  if (!open) return null

  const projects = results.filter(r => r.type === 'project')
  const tasks = results.filter(r => r.type === 'wbs')
  const risks = results.filter(r => r.type === 'risk')
  const files = results.filter(r => r.type === 'attachment')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setOpen(false)}
      />
      
      <div className="relative w-full max-w-xl bg-app-surface border border-app-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <Command 
          className="w-full flex flex-col h-full max-h-[60vh]"
          shouldFilter={false} // We filter on the server
        >
          <div className="flex items-center px-4 py-3 border-b border-app-border gap-3">
            <Search className="w-5 h-5 text-app-muted shrink-0" />
            <Command.Input 
              value={query}
              onValueChange={setQuery}
              placeholder="Search projects, tasks, risks, or files..."
              className="flex-1 bg-transparent outline-none text-app-fg placeholder:text-app-muted text-base"
              autoFocus
            />
            {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
            <button 
              onClick={() => setOpen(false)}
              className="p-1 rounded-md text-app-muted hover:text-app-fg hover:bg-app-hover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {query.length > 0 && results.length === 0 && !loading && (
              <Command.Empty className="py-10 text-center text-sm text-app-muted">
                No results found for "{query}"
              </Command.Empty>
            )}

            {projects.length > 0 && (
              <Command.Group heading="Projects" className="text-xs font-medium text-app-muted px-2 py-1">
                {projects.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg cursor-pointer text-sm text-app-fg hover:bg-app-hover aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/10 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                  >
                    {getIcon(item.type)}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.subtitle && <span className="text-xs text-app-muted truncate group-aria-selected:text-indigo-500/70">{item.subtitle}</span>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {tasks.length > 0 && (
              <Command.Group heading="WBS Elements" className="text-xs font-medium text-app-muted px-2 py-1 mt-2">
                {tasks.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg cursor-pointer text-sm text-app-fg hover:bg-app-hover aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/10 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                  >
                    {getIcon(item.type)}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.subtitle && <span className="text-xs text-app-muted truncate group-aria-selected:text-indigo-500/70">{item.subtitle}</span>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {risks.length > 0 && (
              <Command.Group heading="Risks" className="text-xs font-medium text-app-muted px-2 py-1 mt-2">
                {risks.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg cursor-pointer text-sm text-app-fg hover:bg-app-hover aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/10 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                  >
                    {getIcon(item.type)}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.subtitle && <span className="text-xs text-app-muted truncate group-aria-selected:text-indigo-500/70">{item.subtitle}</span>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {files.length > 0 && (
              <Command.Group heading="Files & Attachments" className="text-xs font-medium text-app-muted px-2 py-1 mt-2">
                {files.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg cursor-pointer text-sm text-app-fg hover:bg-app-hover aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-500/10 aria-selected:text-indigo-600 dark:aria-selected:text-indigo-400 group"
                  >
                    {getIcon(item.type)}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.subtitle && <span className="text-xs text-app-muted truncate group-aria-selected:text-indigo-500/70">{item.subtitle}</span>}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            
            {query.length === 0 && (
              <div className="py-12 px-4 text-center">
                <p className="text-sm text-app-fg mb-1 font-medium">Search across your projects</p>
                <p className="text-xs text-app-muted">Type to find tasks, risks, documents, and more.</p>
                <div className="flex items-center justify-center gap-2 mt-6">
                  <span className="px-1.5 py-0.5 rounded bg-app-border text-[10px] text-app-muted">↑</span>
                  <span className="px-1.5 py-0.5 rounded bg-app-border text-[10px] text-app-muted">↓</span>
                  <span className="text-xs text-app-muted ml-1">to navigate</span>
                  <span className="px-2 py-0.5 ml-2 rounded bg-app-border text-[10px] text-app-muted">Enter</span>
                  <span className="text-xs text-app-muted ml-1">to select</span>
                </div>
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
