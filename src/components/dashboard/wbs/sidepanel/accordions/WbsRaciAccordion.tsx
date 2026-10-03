import { useState } from 'react'
import { Users, ChevronDown, ChevronRight } from 'lucide-react'
import { AiAutoAssignButton } from '../../AiAutoAssignButton'
import { RaciAssignmentPicker } from '../../RaciAssignmentPicker'
import type { WbsElement } from '@/lib/wbs/constants'

type WbsRaciAccordionProps = {
  element: WbsElement
  hasEditAccess: boolean
  onAssignmentChanged?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
  organizationId: string
  tier: string
  aiEnabled: boolean
  callerRole?: string
  callerUserId?: string
}

export function WbsRaciAccordion({
  element,
  hasEditAccess,
  onAssignmentChanged,
  onShowToast,
  organizationId,
  tier,
  aiEnabled,
  callerRole,
  callerUserId,
}: WbsRaciAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-app-border rounded-xl overflow-hidden bg-app-surface">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-app-fg">
          <Users className="w-4 h-4 text-app-muted" />
          RACI Assignments
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-app-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-app-muted" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-app-border bg-app-surface-solid">
          <AiAutoAssignButton 
            organizationId={organizationId}
            projectId={element.projectId}
            wbsElementId={element.id}
            tier={tier}
            aiEnabled={aiEnabled}
            onAssignmentChanged={onAssignmentChanged}
            onShowToast={onShowToast}
          />
          <RaciAssignmentPicker
            projectId={element.projectId || ''}
            wbsElementId={element.id || ''}
            assignments={element.raciAssignments || []}
            hasEditAccess={hasEditAccess}
            onAssignmentChanged={onAssignmentChanged}
            onShowToast={onShowToast}
            callerRole={callerRole}
            callerUserId={callerUserId}
          />
        </div>
      )}
    </div>
  )
}
