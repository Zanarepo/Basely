'use client'

import { Edit3, Trash2 } from 'lucide-react'
import type { ArchitectureDecisionRecord } from '@/lib/adr/actions'

interface AdrPreviewPaneProps {
  item: ArchitectureDecisionRecord
  deletingId: string | null
  onClose: () => void
  onEditClick: (item: ArchitectureDecisionRecord) => void
  onDeleteClick: (id: string, e: React.MouseEvent) => void
}

export function AdrPreviewPane({
  item,
  deletingId,
  onClose,
  onEditClick,
  onDeleteClick
}: AdrPreviewPaneProps) {
  return (
                <div className="sticky top-6 p-6 rounded-2xl bg-app-surface border border-app-border shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-app-border pb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                        Architectural Specification View
                      </span>
                      <h3 className="text-lg font-black text-app-fg leading-tight">
                        {item.title}
                      </h3>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-app-muted hover:text-app-fg text-sm font-semibold px-2 py-1 rounded-lg hover:bg-app-input"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div>
                      <h4 className="font-bold text-app-fg mb-1 text-xs uppercase tracking-wider text-app-subtle">Context & Problem Statement</h4>
                      <p className="text-app-muted leading-relaxed whitespace-pre-wrap">{item.context}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-app-fg mb-1 text-xs uppercase tracking-wider text-app-subtle">Architectural Decision</h4>
                      <p className="text-app-fg font-medium leading-relaxed whitespace-pre-wrap bg-app-input p-3 rounded-xl border border-app-border">{item.decision}</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-app-fg mb-1 text-xs uppercase tracking-wider text-app-subtle">Consequences (Trade-offs & Constraints)</h4>
                      <p className="text-app-muted leading-relaxed whitespace-pre-wrap">{item.consequences}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-app-subtle">
                    <div className="flex items-center gap-4">
                      <span>Logged: {new Date(item.created_at).toLocaleDateString()}</span>
                      <span>Status: <strong className="text-app-fg uppercase font-bold">{item.status}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditClick(item)
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-app-input border border-app-border hover:border-violet-500/50 text-app-fg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:text-violet-300"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-violet-400" /> Edit Record
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onDeleteClick(item.id, e)}
                        disabled={deletingId === item.id}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:text-red-300"
                      >
                        {deletingId === item.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
  )
}
