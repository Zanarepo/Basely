import { Search, ChevronLeft, ChevronRight, FileText, Trash2, Pencil } from 'lucide-react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

interface ActualsTableProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  currentPage: number
  setCurrentPage: (page: number | ((p: number) => number)) => void
  totalPages: number
  paginatedActuals: any[]
  filteredActualsLength: number
  selectedIds: string[]
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void
  hasEditAccess: boolean
  projectCurrency: string
  handleDelete: (id: string) => void
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void
  openEditForm: (actual: any) => void
  ITEMS_PER_PAGE: number
}

export function ActualsTable({
  searchTerm,
  setSearchTerm,
  currentPage,
  setCurrentPage,
  totalPages,
  paginatedActuals,
  filteredActualsLength,
  selectedIds,
  setSelectedIds,
  hasEditAccess,
  projectCurrency,
  handleDelete,
  handleSelectAll,
  openEditForm,
  ITEMS_PER_PAGE
}: ActualsTableProps) {
  return (
    <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-app-border flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search by WBS or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-app-fg"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-app-muted-surface border-b border-app-border">
              <th className="px-6 py-3 text-xs font-semibold text-app-muted uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === paginatedActuals.length && paginatedActuals.length > 0}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer"
                />
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-app-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-app-muted uppercase tracking-wider">WBS</th>
              <th className="px-6 py-3 text-xs font-semibold text-app-muted uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-xs font-semibold text-app-muted uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-xs font-semibold text-app-muted uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {paginatedActuals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-app-subtle">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  {searchTerm ? 'No actuals match your search.' : 'No actual costs recorded yet.'}
                </td>
              </tr>
            ) : (
              paginatedActuals.map((actual) => (
                <tr key={actual.id} className={`hover:bg-app-hover group ${selectedIds.includes(actual.id) ? 'bg-indigo-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(actual.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, actual.id])
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => id !== actual.id))
                        }
                      }}
                      className={`w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer transition-opacity duration-200 ${selectedIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-app-fg whitespace-nowrap">
                    {new Date(actual.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-mono text-xs bg-app-muted-surface px-1.5 py-0.5 rounded text-app-muted mr-2">{actual.wbsCode}</span>
                    <span className="text-app-fg truncate max-w-[200px] inline-block align-bottom">{actual.wbsName}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-app-subtle truncate max-w-[300px]">
                    {actual.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {actual.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-app-fg text-right">
                    <CurrencyDisplay amount={actual.amount} currency={projectCurrency} compactThreshold={1000} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {hasEditAccess && (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditForm(actual)}
                          className="p-1.5 text-app-muted hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(actual.id)}
                          className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-app-border bg-app-surface">
          <span className="text-sm text-app-muted">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredActualsLength)} of {filteredActualsLength} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-app-border text-app-fg hover:bg-app-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-app-fg px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-app-border text-app-fg hover:bg-app-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
