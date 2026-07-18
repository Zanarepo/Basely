'use client'

import { useState, useMemo } from 'react'
import { Plus, Upload, Trash2, Pencil, FileText, CheckCircle2, AlertCircle, X, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { WbsCostData } from '@/lib/cost/types'
import { recordActualCost, updateActualCost, bulkImportActualCosts, deleteActualCost } from '@/lib/actuals/actions'
import { formatCurrency } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

type Props = {
  projectId: string
  wbsCostData: WbsCostData[]
  projectCurrency: string
  hasEditAccess: boolean
  onDataChange: () => void
}

export default function ActualsView({
  projectId, wbsCostData, projectCurrency, hasEditAccess, onDataChange
}: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Search and Pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Form State (shared for Add and Edit)
  const [formWbsId, setFormWbsId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formDesc, setFormDesc] = useState('')

  // CSV Import State
  const [csvText, setCsvText] = useState('')
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload')

  // Flatten actuals for display
  const allActuals = useMemo(() => {
    return wbsCostData.flatMap(w => w.actualCosts.map(a => ({
      ...a,
      wbsCode: w.wbsCode,
      wbsName: w.wbsName
    }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [wbsCostData])

  // Apply search filter
  const filteredActuals = useMemo(() => {
    if (!searchTerm) return allActuals
    const lower = searchTerm.toLowerCase()
    return allActuals.filter(a => 
      a.wbsCode.toLowerCase().includes(lower) || 
      a.wbsName.toLowerCase().includes(lower) || 
      (a.description && a.description.toLowerCase().includes(lower))
    )
  }, [allActuals, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredActuals.length / ITEMS_PER_PAGE))
  
  // Apply pagination
  const paginatedActuals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredActuals.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredActuals, currentPage])

  const totalActual = useMemo(() => {
    return allActuals.reduce((acc, a) => acc + (a.amount || 0), 0)
  }, [allActuals])

  // Get Work Packages that don't have an actual cost yet (or the one being edited)
  const availableWorkPackages = useMemo(() => {
    return wbsCostData.filter(w => {
      if (!w.isWorkPackage) return false;
      if (editingId && w.wbsId === formWbsId) return true;
      return !w.actualCosts || w.actualCosts.length === 0;
    });
  }, [wbsCostData, editingId, formWbsId]);

  const resetForm = () => {
    setFormWbsId('')
    setFormAmount('')
    setFormDate(new Date().toISOString().split('T')[0])
    setFormDesc('')
  }

  const openAddForm = () => {
    resetForm()
    setEditingId(null)
    setIsAdding(true)
    setIsImporting(false)
  }

  const openEditForm = (actual: typeof allActuals[0]) => {
    setFormWbsId(actual.wbs_element_id)
    setFormAmount(actual.amount.toString())
    setFormDate(actual.date)
    setFormDesc(actual.description || '')
    setEditingId(actual.id)
    setIsAdding(true)
    setIsImporting(false)
  }

  const handleSave = async () => {
    if (!formWbsId || !formAmount || !formDate) return
    setIsSaving(true)
    try {
      if (editingId) {
        // Edit mode
        await updateActualCost(editingId, {
          wbs_element_id: formWbsId,
          amount: parseFloat(formAmount),
          date: formDate,
          description: formDesc || null
        })
      } else {
        // Add mode
        await recordActualCost({
          wbs_element_id: formWbsId,
          amount: parseFloat(formAmount),
          currency: projectCurrency,
          date: formDate,
          description: formDesc,
          source: 'manual'
        })
      }
      setIsAdding(false)
      setEditingId(null)
      resetForm()
      onDataChange()
    } catch (err: any) {
      alert(err.message || 'Failed to save actual cost')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this actual cost?')) return
    try {
      await deleteActualCost(id)
      onDataChange()
    } catch (err: any) {
      alert(err.message || 'Failed to delete')
    }
  }

  const handleImport = async () => {
    if (!csvText.trim()) return
    setIsSaving(true)
    setImportSummary(null)
    try {
      const rows = csvText.split('\n').map(r => r.trim()).filter(Boolean)
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
      
      const idxWbs = headers.indexOf('wbs code') >= 0 ? headers.indexOf('wbs code') : headers.indexOf('wbs')
      const idxAmount = headers.indexOf('amount')
      const idxDate = headers.indexOf('date')
      const idxDesc = headers.indexOf('description')

      if (idxWbs < 0 || idxAmount < 0 || idxDate < 0) {
        throw new Error('CSV must include "WBS" (or "WBS Code"), "Amount", and "Date" columns.')
      }

      const toImport = []
      const errors: string[] = []
      let success = 0
      let failed = 0

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim())
        if (cols.length < 3) continue

        const wbsCode = cols[idxWbs]
        const amount = parseFloat(cols[idxAmount])
        const date = cols[idxDate]
        const desc = idxDesc >= 0 ? cols[idxDesc] : ''

        const wbsMatch = wbsCostData.find(w => w.wbsCode === wbsCode)

        if (!wbsMatch) {
          failed++
          errors.push(`Row ${i + 1}: WBS Code "${wbsCode}" not found.`)
          continue
        }

        if (isNaN(amount)) {
          failed++
          errors.push(`Row ${i + 1}: Invalid amount "${cols[idxAmount]}".`)
          continue
        }

        toImport.push({
          wbs_element_id: wbsMatch.wbsId,
          amount,
          currency: projectCurrency,
          date,
          description: desc
        })
        success++
      }

      if (toImport.length > 0) {
        await bulkImportActualCosts(toImport)
        onDataChange()
      }

      setImportSummary({ success, failed, errors })
      if (failed === 0) {
        setTimeout(() => setIsImporting(false), 3000)
      }
    } catch (err: any) {
      alert(err.message || 'Import failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvText(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-app-fg">Actual Costs Tracking</h2>
          <p className="text-sm text-app-subtle">Record real-world spending to compare against your baseline.</p>
        </div>
        <div className="flex gap-2">
          {hasEditAccess && (
            <>
              <button
                onClick={() => { setIsImporting(true); setImportSummary(null); setCsvText(''); setIsAdding(false); setEditingId(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-fg text-sm font-semibold rounded-lg hover:bg-app-hover transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
              <button
                onClick={openAddForm}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Actual
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 flex flex-col justify-center">
          <p className="text-sm font-medium text-app-muted uppercase tracking-wider mb-2">Total Actual Cost</p>
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalActual, projectCurrency)}
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-app-surface border border-indigo-500/30 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-app-fg mb-4">
            {editingId ? 'Edit Actual Cost' : 'Record Manual Actual Cost'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">WBS Element *</label>
              <select
                value={formWbsId}
                onChange={e => setFormWbsId(e.target.value)}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a Work Package...</option>
                {availableWorkPackages.map(w => (
                  <option key={w.wbsId} value={w.wbsId}>{w.wbsCode} - {w.wbsName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Date *</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Amount ({projectCurrency}) *</label>
              <input
                type="number"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Description</label>
              <input
                type="text"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
              className="px-4 py-2 text-app-muted hover:text-app-fg text-sm font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formWbsId || !formAmount || !formDate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingId ? 'Update Actual Cost' : 'Save Actual Cost'}
            </button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-app-border">
              <h3 className="text-xl font-bold text-app-fg">Import Actuals (CSV)</h3>
              <button onClick={() => setIsImporting(false)} className="text-app-muted hover:text-app-fg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setImportMode('upload')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    importMode === 'upload'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-app-muted-surface border-app-border text-app-muted hover:text-app-fg hover:bg-app-hover'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setImportMode('paste')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    importMode === 'paste'
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-app-muted-surface border-app-border text-app-muted hover:text-app-fg hover:bg-app-hover'
                  }`}
                >
                  Paste Text
                </button>
              </div>

              {importMode === 'upload' ? (
                <div className="border-2 border-dashed border-app-border rounded-xl p-8 text-center bg-app-muted-surface/50 mb-6">
                  <Upload className="w-8 h-8 text-app-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-app-fg mb-1">Select a CSV file to upload</p>
                  <p className="text-xs text-app-subtle mb-4">Must include headers: WBS (or WBS Code), Amount, Date, Description</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    <span>Browse Files</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {csvText && <p className="mt-3 text-xs text-indigo-500 font-medium">File loaded. Ready to import.</p>}
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-app-subtle mb-2">
                    Ensure the first row has headers: <strong>WBS, Amount, Date, Description</strong>.
                  </p>
                  <textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    className="w-full h-48 px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="WBS, Amount, Date, Description&#10;1.1.1, 5000, 2026-07-20, Invoice #102"
                  />
                </div>
              )}
              
              {importSummary && (
                <div className={`p-4 mb-6 rounded-xl border ${importSummary.failed > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importSummary.failed > 0 ? <AlertCircle className="w-5 h-5 text-amber-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    <span className="font-bold text-app-fg">Import Complete</span>
                  </div>
                  <p className="text-sm text-app-fg mb-1">{importSummary.success} rows imported successfully.</p>
                  {importSummary.failed > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">{importSummary.failed} rows failed validation:</p>
                      <ul className="text-xs text-amber-600 dark:text-amber-500 list-disc pl-5 max-h-32 overflow-y-auto">
                        {importSummary.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-app-border bg-app-muted-surface">
              <button
                onClick={() => setIsImporting(false)}
                className="px-4 py-2 text-app-muted hover:text-app-fg text-sm font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isSaving || !csvText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {isSaving ? 'Importing...' : 'Run Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and List */}
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
                setCurrentPage(1) // Reset to first page on search
              }}
              className="w-full pl-9 pr-4 py-2 bg-app-input border border-app-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-app-fg"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-muted-surface border-b border-app-border">
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
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-app-subtle">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    {searchTerm ? 'No actuals match your search.' : 'No actual costs recorded yet.'}
                  </td>
                </tr>
              ) : (
                paginatedActuals.map(actual => (
                  <tr key={actual.id} className="hover:bg-app-hover group">
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
                      {formatCurrency(actual.amount, actual.currency)}
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-app-border bg-app-surface">
            <span className="text-sm text-app-muted">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredActuals.length)} of {filteredActuals.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg border border-app-border text-app-fg hover:bg-app-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-app-fg px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg border border-app-border text-app-fg hover:bg-app-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
