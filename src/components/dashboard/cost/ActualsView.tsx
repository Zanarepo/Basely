'use client'

import { useState } from 'react'
import { Plus, Upload, Trash2 } from 'lucide-react'
import type { WbsCostData } from '@/lib/cost/types'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { useActualsTable } from './actuals/hooks/useActualsTable'
import { useActualsForm } from './actuals/hooks/useActualsForm'
import { useActualsImport } from './actuals/hooks/useActualsImport'
import { useGoogleDriveImport } from '@/components/dashboard/wbs/import/hooks/useGoogleDriveImport'
import { ActualsTable } from './actuals/ActualsTable'
import { ActualsForm } from './actuals/ActualsForm'
import { ActualsImportModal } from './actuals/ActualsImportModal'

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
  const [csvText, setCsvText] = useState('')

  // Table Logic
  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedActuals,
    filteredActualsLength,
    selectedIds,
    setSelectedIds,
    totalActual,
    handleDelete,
    handleBulkDelete,
    handleSelectAll,
    ITEMS_PER_PAGE
  } = useActualsTable({ wbsCostData, onDataChange })

  // Form Logic
  const {
    isAdding,
    setIsAdding,
    isSaving: isFormSaving,
    editingId,
    setEditingId,
    formWbsId,
    setFormWbsId,
    formAmount,
    setFormAmount,
    formDate,
    setFormDate,
    formDesc,
    setFormDesc,
    availableWorkPackages,
    resetForm,
    openAddForm,
    openEditForm,
    handleSave
  } = useActualsForm({ wbsCostData, projectCurrency, onDataChange })

  // Import Logic
  const {
    isImporting,
    setIsImporting,
    isSaving: isImportSaving,
    setIsSaving: setIsImportSaving,
    importSummary,
    setImportSummary,
    handleImport
  } = useActualsImport({ wbsCostData, projectCurrency, csvText, onDataChange })

  // Shared Google Drive Logic
  const { isConnected, handleDriveConnect } = useGoogleDriveImport({
    onFileLoaded: setCsvText,
    setIsImporting: setIsImportSaving
  })

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
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedIds.length})
                </button>
              )}
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
            <CurrencyDisplay amount={totalActual} currency={projectCurrency} compactThreshold={1000} />
          </div>
        </div>
      </div>

      {isAdding && (
        <ActualsForm
          editingId={editingId}
          formWbsId={formWbsId}
          setFormWbsId={setFormWbsId}
          formDate={formDate}
          setFormDate={setFormDate}
          formAmount={formAmount}
          setFormAmount={setFormAmount}
          formDesc={formDesc}
          setFormDesc={setFormDesc}
          availableWorkPackages={availableWorkPackages}
          projectCurrency={projectCurrency}
          isSaving={isFormSaving}
          setIsAdding={setIsAdding}
          setEditingId={setEditingId}
          resetForm={resetForm}
          handleSave={handleSave}
        />
      )}

      {isImporting && (
        <ActualsImportModal
          csvText={csvText}
          setCsvText={setCsvText}
          isImporting={isImporting}
          setIsImporting={setIsImporting}
          isSaving={isImportSaving}
          isConnected={isConnected}
          handleDriveConnect={handleDriveConnect}
          importSummary={importSummary}
          handleImport={handleImport}
        />
      )}

      <ActualsTable
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        paginatedActuals={paginatedActuals}
        filteredActualsLength={filteredActualsLength}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        hasEditAccess={hasEditAccess}
        projectCurrency={projectCurrency}
        handleDelete={handleDelete}
        handleSelectAll={handleSelectAll}
        openEditForm={openEditForm}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
      />
    </div>
  )
}
