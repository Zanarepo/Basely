import React from 'react'
import { Plus, ListTodo, Users, Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface MeetingMinutesActionItemsListProps {
  minuteId: string | null
  hasEditAccess: boolean
  actionItems: any[]
  pendingActionItems: any[]
  stakeholders: any[]
  updatePendingActionItem: (id: string, updates: any) => void
  removePendingActionItem: (id: string) => void
  onOpenSpawnModal: () => void
}

export function MeetingMinutesActionItemsList({
  minuteId,
  hasEditAccess,
  actionItems,
  pendingActionItems,
  stakeholders,
  updatePendingActionItem,
  removePendingActionItem,
  onOpenSpawnModal
}: MeetingMinutesActionItemsListProps) {
  if (!minuteId) return null

  const stakeholderOptions = [
    { value: '', label: 'Unassigned' },
    ...stakeholders.map(s => ({ value: s.id, label: s.name }))
  ]

  return (
    <section className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-500/20 rounded-xl shadow-sm overflow-hidden mb-12">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-200/50 dark:border-violet-500/20">
        <div>
          <h3 className="font-bold text-sm text-violet-900 dark:text-violet-300 flex items-center gap-2 mb-1">
            <ListTodo className="w-4 h-4" /> Action Items & Follow-ups
          </h3>
          <p className="text-xs text-violet-700/70 dark:text-violet-300/70 font-medium">
            Create tasks directly linked to this meeting to ensure follow-through.
          </p>
        </div>
        {hasEditAccess && (
          <button
            onClick={onOpenSpawnModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-bold shadow-md shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Action Item
          </button>
        )}
      </div>
      
      <div className="p-6 flex flex-col gap-3">
        {actionItems.length === 0 && pendingActionItems.length === 0 ? (
          <div className="py-6 text-center text-sm font-medium text-violet-900/50 dark:text-violet-300/50">
            No action items have been created for this meeting yet.
          </div>
        ) : (
          [...actionItems, ...pendingActionItems].map(item => (
            <div key={item.id} className="bg-white dark:bg-app-card border border-app-border rounded-lg p-4 flex items-center justify-between shadow-sm group">
              <div className="flex flex-col w-full mr-4">
                {item.id.startsWith('temp-') ? (
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={(e) => updatePendingActionItem(item.id, { description: e.target.value })} 
                    className="font-semibold text-app-fg text-sm bg-transparent focus:outline-none border-b border-dashed border-app-border focus:border-violet-500 pb-0.5" 
                    placeholder="Action item description..."
                  />
                ) : (
                  <span className="font-semibold text-app-fg text-sm">{item.description}</span>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-app-muted font-medium">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 shrink-0" /> 
                    {item.id.startsWith('temp-') ? (
                      <EnterpriseSelect
                        value={item.owner_stakeholder_id || ''}
                        onChange={(val) => updatePendingActionItem(item.id, { owner_stakeholder_id: val || null, owner: stakeholders.find(s=>s.id === val) || null })}
                        options={stakeholderOptions}
                        size="sm"
                        className="bg-transparent !border-0 border-b !border-dashed !border-transparent hover:!border-app-border !p-0 !min-h-0 focus:!ring-0 !shadow-none font-medium text-xs text-app-muted hover:text-app-fg w-40"
                      />
                    ) : (
                      item.owner?.name || 'Unassigned'
                    )}
                  </span>
                  {item.due_date && (
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {item.id.startsWith('temp-') ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                    UNSAVED
                  </span>
                  <button onClick={() => removePendingActionItem(item.id)} className="p-2 text-app-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Remove action item">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-full ${
                  item.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  item.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
