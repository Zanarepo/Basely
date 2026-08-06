'use client'

import { useState } from 'react'
import { Search, Archive, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { archiveAuditLog } from '@/lib/backoffice/plans-actions'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export function AuditLogsTable({ logs, totalCount, currentPage, pageSize }: { logs: any[], totalCount: number, currentPage: number, pageSize: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isArchiving, setIsArchiving] = useState<string | null>(null)
  
  const getAdminLabel = (adminData: any, fallbackId: string) => {
    try {
      if (!adminData) return fallbackId;
      if (Array.isArray(adminData)) {
        return typeof adminData[0]?.email === 'string' ? adminData[0].email : fallbackId;
      }
      if (typeof adminData === 'object') {
        return typeof adminData.email === 'string' ? adminData.email : fallbackId;
      }
      return fallbackId;
    } catch (e) {
      return fallbackId;
    }
  }
  
  const currentSearch = searchParams.get('q') || ''
  const includeArchived = searchParams.get('archived') === 'true'

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get('q') as string
    
    const params = new URLSearchParams(searchParams.toString())
    if (q) {
      params.set('q', q)
    } else {
      params.delete('q')
    }
    params.set('page', '1') // Reset to page 1 on new search
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleArchive = async (logId: string) => {
    setIsArchiving(logId)
    await archiveAuditLog(logId)
    setIsArchiving(null)
  }

  const toggleArchived = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (includeArchived) {
      params.delete('archived')
    } else {
      params.set('archived', 'true')
    }
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="mt-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-app-fg">Audit Log</h2>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input 
              name="q"
              defaultValue={currentSearch}
              placeholder="Search action or tier..."
              className="w-full pl-9 pr-4 py-2 bg-app-surface border border-app-border rounded-xl text-sm text-app-fg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </form>
          
          <button 
            type="button"
            onClick={toggleArchived}
            className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${
              includeArchived 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30' 
                : 'bg-app-surface text-app-muted border-app-border hover:bg-app-hover'
            }`}
          >
            {includeArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-app-surface-solid border-b border-app-border text-app-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Admin</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Tier</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border text-app-fg">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-app-muted">
                    {currentSearch ? 'No audit logs match your search.' : 'No audit logs found.'}
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className={`group hover:bg-app-hover/50 transition-colors ${log.is_archived ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {getAdminLabel(log.admin, log.admin_id)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-indigo-400">{log.action_type}</td>
                    <td className="px-6 py-4 capitalize">{log.target_tier}</td>
                    <td className="px-6 py-4">
                      <pre className="text-[10px] bg-app-surface-solid p-2 rounded-lg border border-app-border overflow-x-auto max-w-xs">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.is_archived ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Archived
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleArchive(log.id)}
                          disabled={isArchiving === log.id}
                          className="cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-app-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all text-xs font-medium disabled:opacity-50"
                        >
                          <Archive className="w-3 h-3" />
                          {isArchiving === log.id ? 'Archiving...' : 'Archive'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-app-border flex items-center justify-between bg-app-surface-solid">
            <p className="text-sm text-app-muted">
              Showing <span className="font-medium text-app-fg">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium text-app-fg">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium text-app-fg">{totalCount}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer p-1 rounded-md text-app-muted hover:bg-app-hover disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-default"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer p-1 rounded-md text-app-muted hover:bg-app-hover disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-default"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
