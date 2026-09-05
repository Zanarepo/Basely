'use client'

import React, { useState } from 'react'
import type { ReleaseScopeItem } from '@/lib/releases/types'
import { ReleaseNotesAiGeneratorModal } from './ReleaseNotesAiGeneratorModal'
import { getDualLabels } from '@/lib/releases/epic-link-constants'
import { ReleaseScopeHeader } from './scope/ReleaseScopeHeader'
import { ReleaseScopeForm } from './scope/ReleaseScopeForm'
import { ReleaseScopeList } from './scope/ReleaseScopeList'
interface ReleaseScopeSectionProps {
  releaseId: string
  releaseName?: string
  projectId?: string
  methodology?: string | null
  scopeItems: ReleaseScopeItem[]
  availableWorkItems: { id: string; type: 'wbs_element' | 'activity'; title: string; code?: string; iterationId?: string | null }[]
  hasEditAccess: boolean
  onAddManualScope: (
    releaseId: string,
    entityType: 'wbs_element' | 'activity' | 'custom_item',
    title: string,
    action: 'added' | 'excluded',
    entityId?: string | null,
    notes?: string | null
  ) => Promise<any>
  onDeleteManualScope: (id: string, releaseId: string) => Promise<any>
}

export function ReleaseScopeSection({
  releaseId,
  releaseName = 'Release Package',
  projectId = '',
  methodology = 'Agile',
  scopeItems,
  availableWorkItems,
  hasEditAccess,
  onAddManualScope,
  onDeleteManualScope,
}: ReleaseScopeSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'by_epic'>('all')

  const labels = getDualLabels(methodology)

  // Filter available work items that aren't already included
  const existingIds = new Set(scopeItems.map(i => i.entityId))
  const candidateItems = availableWorkItems.filter(i => !existingIds.has(i.id))

  // Group scope items by parent Epic / Summary
  const scopeByEpic = React.useMemo(() => {
    const map = new Map<string, { epicName: string; items: ReleaseScopeItem[] }>()
    scopeItems.forEach(item => {
      const epicKey = item.parentEpicId || 'general'
      const epicName = item.parentEpicName || `General / Unassigned ${labels.epicsTerm}`
      if (!map.has(epicKey)) {
        map.set(epicKey, { epicName, items: [] })
      }
      map.get(epicKey)!.items.push(item)
    })
    return Array.from(map.entries())
  }, [scopeItems, labels])

  const handleExcludeAutoItem = async (item: ReleaseScopeItem) => {
    await onAddManualScope(
      releaseId,
      item.entityType,
      item.title,
      'excluded',
      item.entityId,
      'Manually excluded from Release Scope'
    )
  }

  const handleRemoveOverride = async (item: ReleaseScopeItem) => {
    const realId = item.id.replace('man_', '')
    await onDeleteManualScope(realId, releaseId)
  }

  return (
    <div className="space-y-4">
      {/* AI Generator Modal */}
      <ReleaseNotesAiGeneratorModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        releaseId={releaseId}
        releaseName={releaseName}
        projectId={projectId}
        methodology={methodology}
      />

      <ReleaseScopeHeader
        labels={labels}
        hasEditAccess={hasEditAccess}
        showAddForm={showAddForm}
        setShowAddForm={setShowAddForm}
        setShowAiModal={setShowAiModal}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalScopeCount={scopeItems.length}
        totalEpicsCount={scopeByEpic.length}
      />

      {showAddForm && (
        <ReleaseScopeForm
          releaseId={releaseId}
          availableWorkItems={availableWorkItems}
          candidateItems={candidateItems}
          onAddManualScope={onAddManualScope}
          setShowAddForm={setShowAddForm}
        />
      )}

      <ReleaseScopeList
        scopeItems={scopeItems}
        scopeByEpic={scopeByEpic}
        viewMode={viewMode}
        labels={labels}
        hasEditAccess={hasEditAccess}
        onExcludeAutoItem={handleExcludeAutoItem}
        onRemoveOverride={handleRemoveOverride}
      />
    </div>
  )
}
