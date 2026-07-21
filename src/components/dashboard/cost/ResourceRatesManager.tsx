'use client'

import React, { useState } from 'react'
import { ResourceRate } from '@/lib/cost/types'
import { ResourceRatesImportModal } from './ResourceRatesImportModal'
import { useResourceSettings } from './resource-rates/hooks/useResourceSettings'
import { useResourceRatesTable } from './resource-rates/hooks/useResourceRatesTable'
import { ResourceSettings } from './resource-rates/ResourceSettings'
import { ResourceRatesTable } from './resource-rates/ResourceRatesTable'

interface ResourceRatesManagerProps {
  projectId: string
  resourceRates: ResourceRate[]
  projectCurrency: string
  globalOverhead: number
  contingencyAmount: number
  contingencyType: 'flat' | 'percentage'
  hasEditAccess: boolean
  onDataChange: () => void
}

export default function ResourceRatesManager({
  projectId,
  resourceRates,
  projectCurrency,
  globalOverhead,
  contingencyAmount,
  contingencyType,
  hasEditAccess,
  onDataChange
}: ResourceRatesManagerProps) {
  const [isImporting, setIsImporting] = useState(false)

  // Settings Logic (Overhead and Contingency)
  const {
    activeSettingsTab,
    setActiveSettingsTab,
    isEditingOverhead,
    setIsEditingOverhead,
    overheadVal,
    setOverheadVal,
    isEditingContingency,
    setIsEditingContingency,
    contingencyVal,
    setContingencyVal,
    selectedContingencyType,
    setSelectedContingencyType,
    handleSaveOverhead,
    handleSaveContingency
  } = useResourceSettings({
    projectId, globalOverhead, contingencyAmount, contingencyType, onDataChange
  })

  // Table Logic (Filtering, Adding/Editing, Bulk Selection)
  const {
    editingId,
    isCreating,
    searchTerm,
    setSearchTerm,
    selectedIds,
    setSelectedIds,
    name,
    setName,
    type,
    setType,
    rate,
    setRate,
    unit,
    setUnit,
    filteredRates,
    startCreate,
    startEdit,
    cancelEdit,
    handleSave,
    handleDelete,
    handleBulkDelete,
    handleSelectAll
  } = useResourceRatesTable({
    projectId, resourceRates, projectCurrency, onDataChange
  })

  return (
    <div className="space-y-6">
      <ResourceSettings
        hasEditAccess={hasEditAccess}
        globalOverhead={globalOverhead}
        contingencyAmount={contingencyAmount}
        contingencyType={contingencyType}
        projectCurrency={projectCurrency}
        activeSettingsTab={activeSettingsTab}
        setActiveSettingsTab={setActiveSettingsTab}
        isEditingOverhead={isEditingOverhead}
        setIsEditingOverhead={setIsEditingOverhead}
        overheadVal={overheadVal}
        setOverheadVal={setOverheadVal}
        isEditingContingency={isEditingContingency}
        setIsEditingContingency={setIsEditingContingency}
        contingencyVal={contingencyVal}
        setContingencyVal={setContingencyVal}
        selectedContingencyType={selectedContingencyType}
        setSelectedContingencyType={setSelectedContingencyType}
        handleSaveOverhead={handleSaveOverhead}
        handleSaveContingency={handleSaveContingency}
      />

      <ResourceRatesTable
        hasEditAccess={hasEditAccess}
        projectCurrency={projectCurrency}
        resourceRatesLength={resourceRates.length}
        filteredRates={filteredRates}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        handleSelectAll={handleSelectAll}
        handleBulkDelete={handleBulkDelete}
        setIsImporting={setIsImporting}
        isCreating={isCreating}
        startCreate={startCreate}
        editingId={editingId}
        name={name}
        setName={setName}
        type={type}
        setType={setType}
        rate={rate}
        setRate={setRate}
        unit={unit}
        setUnit={setUnit}
        handleSave={handleSave}
        cancelEdit={cancelEdit}
        startEdit={startEdit}
        handleDelete={handleDelete}
      />

      {isImporting && (
        <ResourceRatesImportModal
          projectId={projectId}
          projectCurrency={projectCurrency}
          onClose={() => setIsImporting(false)}
          onSuccess={() => {
            setIsImporting(false)
            onDataChange()
          }}
        />
      )}
    </div>
  )
}
