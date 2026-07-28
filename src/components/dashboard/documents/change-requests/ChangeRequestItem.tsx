import { ChangeRequestEntry } from '@/lib/documents/change-requests'
import { CheckCircle, XCircle, Clock, FileMinus, Trash2 } from 'lucide-react'

interface Props {
  entry: ChangeRequestEntry
  onUpdateStatus: (id: string, outcome: 'pending' | 'approved' | 'rejected' | 'withdrawn') => void
  isManager?: boolean
  onDelete?: (id: string) => void
}

export function ChangeRequestItem({ entry, onUpdateStatus, isManager, onDelete }: Props) {
  const getStatusIcon = () => {
    switch (entry.outcome) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />
      case 'withdrawn': return <FileMinus className="w-5 h-5 text-gray-500" />
      default: return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = () => {
    switch (entry.outcome) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'withdrawn': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  const isStandalone = entry.source === 'standalone'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">
            {entry.description}
          </h4>
          {entry.source === 'approval_workflow' && (
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ml-2">
              Workflow
            </span>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${getStatusBadge()}`}>
          {entry.outcome}
        </span>
      </div>

      {entry.rationale && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
          {entry.rationale}
        </p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Logged by {entry.creator?.full_name || entry.creator?.email} on {new Date(entry.created_at).toLocaleDateString()}
        </div>
        
        {/* Hover actions for standalone requests */}
        {isManager && isStandalone && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors cursor-pointer"
                title="Delete request"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {entry.outcome === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onUpdateStatus(entry.id, 'approved')}
                  className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded cursor-pointer transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => onUpdateStatus(entry.id, 'rejected')}
                  className="text-xs font-medium px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded cursor-pointer transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onUpdateStatus(entry.id, 'withdrawn')}
                  className="text-xs font-medium px-2 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors"
                >
                  Withdraw
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
