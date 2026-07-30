'use client'

import { X, Loader2 } from 'lucide-react'
import { ResourceType, ResourceUnit } from '@/lib/cost/types'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ResourceRateFormModalProps {
  isEditing: boolean
  projectCurrency: string
  name: string
  setName: (val: string) => void
  type: ResourceType
  setType: (val: ResourceType) => void
  rate: number
  setRate: (val: number) => void
  unit: ResourceUnit
  setUnit: (val: ResourceUnit) => void
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
}

export function ResourceRateFormModal({
  isEditing,
  projectCurrency,
  name,
  setName,
  type,
  setType,
  rate,
  setRate,
  unit,
  setUnit,
  isSaving,
  onSave,
  onCancel,
}: ResourceRateFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-app-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h3 className="text-xl font-bold text-app-fg">
            {isEditing ? 'Edit Resource Rate' : 'Add Resource Rate'}
          </h3>
          <button onClick={onCancel} className="text-app-muted hover:text-app-fg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-app-fg mb-1.5">Name</label>
            <input
              type="text"
              placeholder="e.g. Senior Engineer"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-app-fg placeholder:text-app-muted"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-app-fg mb-1.5">Type</label>
            <EnterpriseSelect
              value={type}
              onChange={(val) => setType(val as ResourceType)}
              options={[
                { value: 'labor', label: 'Labor (Human Resource / Time)', description: 'Billed by hourly or daily duration' },
                { value: 'material', label: 'Material & Equipment', description: 'Physical components, licenses, or hardware' },
                { value: 'fixed', label: 'Fixed Cost / Service', description: 'One-off fee or lump-sum contract amount' },
              ]}
            />
          </div>

          {/* Rate + Unit */}
          <div>
            <label className="block text-sm font-medium text-app-fg mb-1.5">Rate</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted text-sm font-medium">
                  {projectCurrency}
                </span>
                <input
                  type="number"
                  value={rate}
                  onChange={e => setRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-app-bg border border-app-border rounded-xl pl-12 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-app-fg"
                />
              </div>
              <span className="text-app-muted font-medium">/</span>
              <div className="w-40">
                <EnterpriseSelect
                  value={unit}
                  onChange={(val) => setUnit(val as ResourceUnit)}
                  options={[
                    { value: 'hr', label: 'hr (Hourly)', description: 'Per hour billing' },
                    { value: 'day', label: 'day (Daily)', description: 'Per working day' },
                    { value: 'unit', label: 'unit', description: 'Per item / unit' },
                    { value: 'flat', label: 'flat', description: 'Fixed fee per task' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-app-border bg-app-muted-surface">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-app-muted hover:text-app-fg text-sm font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isEditing ? 'Save Changes' : 'Add Resource')}
          </button>
        </div>
      </div>
    </div>
  )
}
