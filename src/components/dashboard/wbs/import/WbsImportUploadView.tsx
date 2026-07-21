import { Upload } from 'lucide-react'

interface WbsImportUploadViewProps {
  csvText: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function WbsImportUploadView({ csvText, fileInputRef, handleFileUpload }: WbsImportUploadViewProps) {
  return (
    <div className="border-2 border-dashed border-app-border rounded-xl p-8 text-center bg-app-muted-surface/50 mb-6">
      <Upload className="w-8 h-8 text-app-muted mx-auto mb-3" />
      <p className="text-sm font-medium text-app-fg mb-1">Select a CSV file to upload</p>
      <p className="text-xs text-app-subtle mb-4">Must include headers: Task Name. Optional: WBS Code, Type (Summary/Task)</p>
      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
        <span>Browse Files</span>
        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
      </label>
      {csvText && <p className="mt-3 text-xs text-indigo-500 font-medium">File loaded. Ready to import.</p>}
    </div>
  )
}
