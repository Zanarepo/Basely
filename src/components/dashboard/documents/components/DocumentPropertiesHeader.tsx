'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react'
import { useDocumentProperties, DocumentProperties } from '../hooks/useDocumentProperties'
import { PropertyStatusPopover } from './properties/components/PropertyStatusPopover'
import { PropertyPriorityPopover } from './properties/components/PropertyPriorityPopover'
import { PropertyOwnerPopover } from './properties/components/PropertyOwnerPopover'
import { PropertyReleaseSprintPopovers } from './properties/components/PropertyReleaseSprintPopovers'
import { PropertyTagsPopover } from './properties/components/PropertyTagsPopover'
import { getStatusBadgeStyle, getPriorityBadgeStyle } from './properties/constants/propertyOptions'

interface DocumentPropertiesHeaderProps {
  projectId: string
  documentType: string
  freeText: Record<string, string>
  setFreeText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setIsDirty: (dirty: boolean) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
  hasEditAccess: boolean
  isSnapshot?: boolean
}

export default function DocumentPropertiesHeader({
  projectId,
  documentType,
  freeText,
  setFreeText,
  setIsDirty,
  onShowToast,
  hasEditAccess,
  isSnapshot = false,
}: DocumentPropertiesHeaderProps) {
  const {
    properties,
    members,
    projectReleases,
    projectIterations,
    updateProperty,
    addTag,
    removeTag,
  } = useDocumentProperties({
    projectId,
    documentType,
    freeText,
    setFreeText,
    setIsDirty,
    onShowToast,
    isSnapshot,
  })

  // Accordion state - defaults to collapsed (clean 1-line bar) to avoid info overload!
  const [isCollapsed, setIsCollapsed] = useState(true)

  const [activePopover, setActivePopover] = useState<'status' | 'owner' | 'priority' | 'release' | 'sprint' | 'date' | 'tag' | null>(null)
  const [newTagInput, setNewTagInput] = useState('')
  const [releaseInput, setReleaseInput] = useState(properties.targetRelease || '')
  const [sprintInput, setSprintInput] = useState(properties.targetSprint || '')
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync inputs when properties change
  useEffect(() => {
    setReleaseInput(properties.targetRelease || '')
  }, [properties.targetRelease])

  useEffect(() => {
    setSprintInput(properties.targetSprint || '')
  }, [properties.targetSprint])

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null)
      }
    }
    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activePopover])

  return (
    <div
      ref={containerRef}
      className="mb-6 rounded-2xl bg-app-surface/90 border border-app-border shadow-xs text-xs font-medium text-app-fg transition-all duration-200"
    >
      {/* Top Accordion Trigger Bar (Clean 1-Line Summary) */}
      <div
        style={{ cursor: 'pointer' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-4 py-3 hover:bg-app-hover/50 rounded-2xl transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="font-bold text-app-fg text-xs uppercase tracking-wider">
            Document Properties Grid
          </span>
          <span className="text-[10px] text-app-muted font-normal">
            ({properties.status ? properties.status.replace('_', ' ') : 'draft'} • {properties.priority || 'P2'} • {properties.targetRelease || 'Release 0'} • {properties.targetSprint || 'Sprint 1'})
          </span>
        </div>

        {/* Right Collapsed Summary Badges */}
        <div className="flex items-center gap-2">
          {isCollapsed && (
            <div className="hidden sm:flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getStatusBadgeStyle(properties.status)}`}>
                {properties.status ? properties.status.replace('_', ' ') : 'Draft'}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getPriorityBadgeStyle(properties.priority)}`}>
                {properties.priority || 'P2'}
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                🚀 {properties.targetRelease || 'Release 0'}
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                ⚡ {properties.targetSprint || 'Sprint 1'}
              </span>
            </div>
          )}

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            className="p-1 rounded-lg hover:bg-app-hover text-app-muted hover:text-app-fg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand document properties table' : 'Collapse document properties table'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Property Grid Table (2 Spacious Rows) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-app-border space-y-3 animate-in fade-in zoom-in-95 duration-150">
          {/* ROW 1: Status, Owner, Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PropertyStatusPopover
              status={properties.status}
              hasEditAccess={hasEditAccess}
              isOpen={activePopover === 'status'}
              onToggle={() => setActivePopover(activePopover === 'status' ? null : 'status')}
              onSelect={(st) => {
                updateProperty('status', st)
                setActivePopover(null)
              }}
            />

            <PropertyOwnerPopover
              ownerName={properties.ownerName || ''}
              members={members}
              hasEditAccess={hasEditAccess}
              isOpen={activePopover === 'owner'}
              onToggle={() => setActivePopover(activePopover === 'owner' ? null : 'owner')}
              onSelectOwner={(id, name) => {
                updateProperty('ownerId', id)
                updateProperty('ownerName', name)
                setActivePopover(null)
              }}
            />

            <PropertyPriorityPopover
              priority={properties.priority}
              hasEditAccess={hasEditAccess}
              isOpen={activePopover === 'priority'}
              onToggle={() => setActivePopover(activePopover === 'priority' ? null : 'priority')}
              onSelect={(pr) => {
                updateProperty('priority', pr)
                setActivePopover(null)
              }}
            />
          </div>

          {/* ROW 2: Target Release, Sprint, Target Date, Domain Tags */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <PropertyReleaseSprintPopovers
              targetRelease={properties.targetRelease || ''}
              targetSprint={properties.targetSprint || ''}
              projectReleases={projectReleases}
              projectIterations={projectIterations}
              releaseInput={releaseInput}
              setReleaseInput={setReleaseInput}
              sprintInput={sprintInput}
              setSprintInput={setSprintInput}
              hasEditAccess={hasEditAccess}
              activePopover={activePopover === 'release' ? 'release' : activePopover === 'sprint' ? 'sprint' : null}
              onToggleRelease={() => setActivePopover(activePopover === 'release' ? null : 'release')}
              onToggleSprint={() => setActivePopover(activePopover === 'sprint' ? null : 'sprint')}
              onSelectRelease={(val) => {
                updateProperty('targetRelease', val)
                setActivePopover(null)
              }}
              onSelectSprint={(val) => {
                updateProperty('targetSprint', val)
                setActivePopover(null)
              }}
            />

            {/* Target Target Date Input */}
            <div className="relative flex items-center justify-between p-2 rounded-xl bg-app-surface border border-app-border">
              <div className="flex items-center gap-1.5 text-app-muted">
                <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold text-app-fg text-xs">Target Date:</span>
              </div>

              <input
                type="date"
                disabled={!hasEditAccess}
                value={properties.targetDate || ''}
                onChange={(e) => updateProperty('targetDate', e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-app-fg"
              />
            </div>

            {/* Domain Tags */}
            <PropertyTagsPopover
              tags={properties.tags || []}
              hasEditAccess={hasEditAccess}
              isOpen={activePopover === 'tag'}
              onToggle={() => setActivePopover(activePopover === 'tag' ? null : 'tag')}
              newTagInput={newTagInput}
              setNewTagInput={setNewTagInput}
              onAddTag={(tg) => {
                addTag(tg)
                setActivePopover(null)
              }}
              onRemoveTag={(tg) => removeTag(tg)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
