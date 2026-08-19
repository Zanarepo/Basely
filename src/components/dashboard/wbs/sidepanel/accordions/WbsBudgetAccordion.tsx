import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { WbsResourceAssignments } from '../WbsResourceAssignments'

type WbsBudgetAccordionProps = {
  wbsElementId: string
  wbsName: string
  projectId: string
  cost: number | undefined
  setCost: (cost: number | undefined) => void
  estimationMethod: string | null | undefined
  setEstimationMethod: (method: any) => void
  hasEditAccess: boolean
  saving: boolean
  currency: string
  onAssignmentChanged?: () => void
}

export function WbsBudgetAccordion({
  wbsElementId,
  wbsName,
  projectId,
  cost,
  setCost,
  estimationMethod,
  setEstimationMethod,
  hasEditAccess,
  saving,
  currency,
  onAssignmentChanged,
}: WbsBudgetAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-green-500/25 rounded-xl overflow-hidden bg-green-500/5 dark:bg-green-950/20 shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent hover:bg-green-500/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
          <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">$</span>
          Budget & Resource Assignments
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-green-500/70" />
        ) : (
          <ChevronRight className="w-4 h-4 text-green-500/70" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-green-500/25 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="auth-label block mb-1">Budget Amount</label>
              <input
                type="number"
                value={cost || ''}
                onChange={(e) => setCost(e.target.value ? Number(e.target.value) : undefined)}
                disabled={!hasEditAccess || saving}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-app-input border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:border-green-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="auth-label block mb-1">Estimation Method</label>
              <EnterpriseSelect
                value={estimationMethod}
                onChange={(val) => setEstimationMethod(val)}
                disabled={!hasEditAccess || saving}
                size="md"
                options={[
                  { value: 'bottom_up', label: 'Bottom-Up' },
                  { value: 'analogous', label: 'Analogous' },
                  { value: 'parametric', label: 'Parametric' }
                ]}
                placeholder="Select method..."
              />
            </div>
          </div>

          {/* Direct Resource Assignment section */}
          <div className="pt-2 border-t border-green-500/20">
            <WbsResourceAssignments
              wbsElementId={wbsElementId}
              wbsName={wbsName}
              projectId={projectId}
              hasEditAccess={hasEditAccess}
              currency={currency}
              onAssignmentsChanged={onAssignmentChanged}
            />
          </div>
        </div>
      )}
    </div>
  )
}
