'use client'

import { useState, useEffect } from 'react'
import { getDeliverables, generateDeliverableSignoffLink, initiateInternalDeliverableSignoff, getProjectStakeholders, getProjectMembers, DeliverableItem } from '@/lib/documents/deliverables'
import { FileCheck, ExternalLink, ShieldCheck, ClipboardCheck, Copy, Check, Loader2, Trash2, Search } from 'lucide-react'
import { DocumentLoader } from '../DocumentLoader'

interface DeliverableSignoffSheetProps {
  projectId: string
  hasEditAccess?: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function DeliverableSignoffSheet({ projectId, hasEditAccess, onShowToast }: DeliverableSignoffSheetProps) {
  const [items, setItems] = useState<DeliverableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [stakeholders, setStakeholders] = useState<{id: string, name: string, email: string}[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [selectedExternalId, setSelectedExternalId] = useState('')
  const [selectedInternalId, setSelectedInternalId] = useState('')
  const [selectedWbsForInternal, setSelectedWbsForInternal] = useState<string | null>(null)
  const [selectedWbs, setSelectedWbs] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedSignoffs, setSelectedSignoffs] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, st, mem] = await Promise.all([
        getDeliverables(projectId),
        getProjectStakeholders(projectId),
        getProjectMembers(projectId)
      ])
      setItems(data)
      setStakeholders(st)
      setMembers(mem)
    } catch (err: any) {
      setError(err.message || 'Failed to load deliverables.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const handleSignoffRequest = async (wbsId: string, stakeholderId: string, isInternal: boolean, action: 'email' | 'copy') => {
    if (!stakeholderId) return
    setProcessingId(wbsId)
    try {
      const res = await generateDeliverableSignoffLink(wbsId, stakeholderId, { 
        isInternal, 
        skipEmail: action === 'copy' 
      })
      if (!res.ok) throw new Error(res.error)
      if (res.inviteUrl) {
        await navigator.clipboard.writeText(res.inviteUrl)
        setCopiedLink(wbsId)
        setTimeout(() => setCopiedLink(null), 3000)
        await fetchData()
        if (onShowToast) {
          if (action === 'email') onShowToast('success', 'Sign-off link generated and email sent successfully!')
          else onShowToast('success', 'Sign-off link generated and copied to clipboard!')
        }
      }
      setSelectedWbs(null)
      setSelectedWbsForInternal(null)
      setSelectedExternalId('')
      setSelectedInternalId('')
    } catch (err: any) {
      if (onShowToast) onShowToast('error', err.message || 'An error occurred')
      else alert(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteSignoffs = async (signoffIds: string[]) => {
    setIsDeleting(true)
    try {
      // Import here to avoid circular dependencies if any, or just import at top
      const { deleteSignoffs } = await import('@/lib/documents/deliverables')
      const res = await deleteSignoffs(signoffIds)
      if (!res.ok) throw new Error(res.error)
      await fetchData()
      if (onShowToast) onShowToast('success', `Successfully deleted ${signoffIds.length} sign-off request(s)!`)
      setSelectedSignoffs([])
    } catch (err: any) {
      if (onShowToast) onShowToast('error', err.message || 'Failed to delete sign-offs')
      else alert(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSignoffSelection = (signoffId: string) => {
    setSelectedSignoffs(prev => 
      prev.includes(signoffId) ? prev.filter(id => id !== signoffId) : [...prev, signoffId]
    )
  }

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase()
    return item.name.toLowerCase().includes(q) || 
           item.signoff?.signed_by_reference.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex-none p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deliverable Sign-off Sheets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Request external stakeholder sign-off or approve deliverables internally.
            </p>
          </div>
        </div>
        {selectedSignoffs.length > 0 && (
          <button
            onClick={() => handleDeleteSignoffs(selectedSignoffs)}
            disabled={isDeleting}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete Selected ({selectedSignoffs.length})
          </button>
        )}
      </div>

      <div className="p-4 md:px-6 md:pt-4 md:pb-0">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search deliverables or stakeholders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <DocumentLoader message="Loading deliverables and sign-offs..." />
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Deliverables Found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
              Deliverables are tied to WBS Elements. Add a task or phase to your Work Breakdown Structure to see it here.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No matches found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
              We couldn't find any deliverables or sign-offs matching "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map(item => (
              <div key={item.id} className="group flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                {item.signoff && (
                  <div className={`mt-1 transition-opacity ${selectedSignoffs.includes(item.signoff.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input 
                      type="checkbox"
                      checked={selectedSignoffs.includes(item.signoff.id)}
                      onChange={() => toggleSignoffSelection(item.signoff!.id)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      {item.signoff && (
                        <button
                          onClick={() => handleDeleteSignoffs([item.signoff!.id])}
                          disabled={isDeleting}
                          title="Delete this sign-off request"
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all rounded hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                    
                    {item.signoff && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        {item.signoff.signed_at ? (
                          <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            Signed by {item.signoff.signed_by_reference} on {new Date(item.signoff.signed_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-600 dark:text-amber-400">
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            Pending {item.signoff.signed_by_type === 'internal_user' ? 'internal' : 'external'} sign-off from {item.signoff.signed_by_reference}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions - Only visible on hover unless actively selecting for external signoff */}
                  {!item.signoff?.signed_at && (
                    <div className={`flex flex-col sm:flex-row gap-2 ${selectedWbs === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      {selectedWbs === item.id ? (
                        <div className="flex flex-col gap-2 min-w-[250px] p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm">
                          <select
                            className="text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-600 w-full text-gray-900 dark:text-white"
                            value={selectedExternalId}
                            onChange={e => setSelectedExternalId(e.target.value)}
                          >
                            <option value="">Select Stakeholder...</option>
                            {stakeholders.map(sh => (
                              <option key={sh.id} value={sh.id}>
                                {sh.name} {sh.email ? `(${sh.email})` : ''}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2 justify-end mt-1">
                            <button onClick={() => setSelectedWbs(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors">Cancel</button>
                            <button 
                              onClick={() => handleSignoffRequest(item.id, selectedExternalId, false, 'copy')}
                              disabled={!selectedExternalId || processingId === item.id}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 px-3 py-1.5 rounded font-medium disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              Copy Link Only
                            </button>
                            <button 
                              onClick={() => handleSignoffRequest(item.id, selectedExternalId, false, 'email')}
                              disabled={!selectedExternalId || processingId === item.id}
                              className="text-xs inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              {processingId === item.id ? (
                                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending...</>
                              ) : 'Generate & Email Link'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {item.signoff && !item.signoff.signed_at && item.signoff.token ? (
                            <button
                              onClick={() => {
                                const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
                                navigator.clipboard.writeText(`${origin}/signoff?token=${encodeURIComponent(item.signoff?.token!)}`)
                                setCopiedLink(item.id)
                                setTimeout(() => setCopiedLink(null), 3000)
                              }}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-md transition-colors cursor-pointer"
                            >
                              {copiedLink === item.id ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                              Copy Link
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedWbs(item.id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-md transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              External Link
                            </button>
                          )}
                          {selectedWbsForInternal === item.id ? (
                            <div className="flex flex-col gap-2 min-w-[250px] p-3 bg-white dark:bg-gray-700 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-sm">
                              <select
                                className="text-sm px-2 py-1.5 rounded border border-gray-300 dark:border-gray-500 bg-gray-50 dark:bg-gray-600 w-full text-gray-900 dark:text-white"
                                value={selectedInternalId}
                                onChange={e => setSelectedInternalId(e.target.value)}
                              >
                                <option value="">Select Team Member...</option>
                                {members.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.name || m.email} {m.role_title ? `(${m.role_title})` : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2 justify-end mt-1">
                                <button onClick={() => setSelectedWbsForInternal(null)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors">Cancel</button>
                                <button 
                                  onClick={() => handleSignoffRequest(item.id, selectedInternalId, true, 'copy')}
                                  disabled={!selectedInternalId || processingId === item.id}
                                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 dark:text-emerald-200 px-3 py-1.5 rounded font-medium disabled:opacity-50 cursor-pointer transition-colors"
                                >
                                  Copy Link Only
                                </button>
                                <button 
                                  onClick={() => handleSignoffRequest(item.id, selectedInternalId, true, 'email')}
                                  disabled={!selectedInternalId || processingId === item.id}
                                  className="text-xs inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50 cursor-pointer transition-colors"
                                >
                                  {processingId === item.id ? (
                                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending...</>
                                  ) : 'Generate & Email Link'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedWbsForInternal(item.id)}
                              disabled={processingId === item.id}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <FileCheck className="w-4 h-4 mr-2" />
                              Internal Sign-off
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
