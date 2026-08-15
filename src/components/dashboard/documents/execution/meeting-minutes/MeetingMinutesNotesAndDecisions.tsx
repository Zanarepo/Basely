import React from 'react'
import { AlignLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react'

interface MeetingMinutesNotesAndDecisionsProps {
  hasEditAccess: boolean
  discussionNotes: string
  setDiscussionNotes: (val: string) => void
  decisions: any[]
  addDecision: () => void
  updateDecision: (id: string, text: string) => void
  removeDecision: (id: string) => void
}

export function MeetingMinutesNotesAndDecisions({
  hasEditAccess,
  discussionNotes,
  setDiscussionNotes,
  decisions,
  addDecision,
  updateDecision,
  removeDecision
}: MeetingMinutesNotesAndDecisionsProps) {
  return (
    <>
      {/* Discussion Notes Section */}
      <section className="bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-app-border bg-gray-50/50 dark:bg-app-bg/50">
          <h3 className="font-bold text-sm text-app-fg flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-violet-500" /> Discussion Notes & Agenda
          </h3>
        </div>
        <textarea
          value={discussionNotes}
          onChange={(e) => setDiscussionNotes(e.target.value)}
          disabled={!hasEditAccess}
          className="w-full bg-transparent border-none p-6 text-sm text-app-fg focus:outline-none focus:ring-0 min-h-[300px] resize-y placeholder:text-app-muted/50 leading-relaxed"
          placeholder="Start typing your meeting notes here..."
        />
      </section>

      {/* Decisions Section */}
      <section className="bg-white dark:bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-app-border bg-gray-50/50 dark:bg-app-bg/50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-app-fg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Decisions Made
          </h3>
          {hasEditAccess && (
            <button
              onClick={addDecision}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-app-bg border border-app-border hover:bg-gray-50 dark:hover:bg-app-hover rounded-md transition-colors text-xs font-bold text-app-fg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Decision
            </button>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex flex-col gap-3">
            {decisions.length === 0 ? (
              <div className="py-8 border-2 border-dashed border-app-border rounded-xl text-center text-sm font-medium text-app-muted">
                No decisions recorded yet.
              </div>
            ) : (
              decisions.map((d) => (
                <div key={d.id} className="flex items-start gap-3 group">
                  <div className="mt-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500/80" />
                  </div>
                  <div className="flex-1 bg-app-bg border border-app-border rounded-lg overflow-hidden flex items-center focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all shadow-inner">
                    <input
                      type="text"
                      value={d.text}
                      onChange={(e) => updateDecision(d.id, e.target.value)}
                      disabled={!hasEditAccess}
                      placeholder="e.g. Approved $5k extra budget for QA servers"
                      className="flex-1 bg-transparent px-4 py-2.5 text-sm font-medium text-app-fg focus:outline-none"
                    />
                    {hasEditAccess && (
                      <button
                        onClick={() => removeDecision(d.id)}
                        className="p-3 text-app-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  )
}
