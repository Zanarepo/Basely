import { X, Loader2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

interface ActualsFormProps {
  editingId: string | null
  formWbsId: string
  setFormWbsId: (val: string) => void
  formDate: string
  setFormDate: (val: string) => void
  formAmount: string
  setFormAmount: (val: string) => void
  formDesc: string
  setFormDesc: (val: string) => void
  availableWorkPackages: any[]
  projectCurrency: string
  isSaving: boolean
  setIsAdding: (val: boolean) => void
  setEditingId: (val: string | null) => void
  resetForm: () => void
  handleSave: () => void
}

export function ActualsForm({
  editingId,
  formWbsId,
  setFormWbsId,
  formDate,
  setFormDate,
  formAmount,
  setFormAmount,
  formDesc,
  setFormDesc,
  availableWorkPackages,
  projectCurrency,
  isSaving,
  setIsAdding,
  setEditingId,
  resetForm,
  handleSave
}: ActualsFormProps) {
  const handleClose = () => {
    setIsAdding(false)
    setEditingId(null)
    resetForm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-app-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h3 className="text-xl font-bold text-app-fg">
            {editingId ? 'Edit Actual Cost' : 'Record Actual Cost'}
          </h3>
          <button onClick={handleClose} className="text-app-muted hover:text-app-fg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* WBS Element */}
          <div>
            <label className="block text-sm font-medium text-app-fg mb-1.5">WBS Element *</label>
            <EnterpriseSelect
              value={formWbsId}
              onChange={(val) => setFormWbsId(val)}
              placeholder="Select a Work Package..."
              options={[
                { value: '', label: 'Select a Work Package...' },
                ...availableWorkPackages.map((w) => ({
                  value: w.wbsId,
                  label: `${w.wbsCode} - ${w.wbsName}`,
                  description: `WBS Code: ${w.wbsCode}`
                }))
              ]}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-app-fg mb-1.5">Date *</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-app-fg mb-1.5">Amount ({projectCurrency}) *</label>
            <input
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-app-fg mb-1.5">Description</label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-app-border bg-app-muted-surface">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-app-muted hover:text-app-fg text-sm font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formWbsId || !formAmount || !formDate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingId ? 'Update Actual Cost' : 'Save Actual Cost'}
          </button>
        </div>
      </div>
    </div>
  )
}
