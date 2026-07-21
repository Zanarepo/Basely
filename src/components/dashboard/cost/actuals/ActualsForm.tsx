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
  return (
    <div className="bg-app-surface border border-indigo-500/30 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
      <h3 className="text-lg font-bold text-app-fg mb-4">
        {editingId ? 'Edit Actual Cost' : 'Record Manual Actual Cost'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">WBS Element *</label>
          <select
            value={formWbsId}
            onChange={(e) => setFormWbsId(e.target.value)}
            className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a Work Package...</option>
            {availableWorkPackages.map((w) => (
              <option key={w.wbsId} value={w.wbsId}>{w.wbsCode} - {w.wbsName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Date *</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Amount ({projectCurrency}) *</label>
          <input
            type="number"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-app-muted uppercase tracking-wider mb-2">Description</label>
          <input
            type="text"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
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
  )
}
