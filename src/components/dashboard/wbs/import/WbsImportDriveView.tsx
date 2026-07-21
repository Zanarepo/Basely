import { Cloud } from 'lucide-react'

interface WbsImportDriveViewProps {
  csvText: string
  isImporting: boolean
  isConnected: boolean
  handleDriveConnect: () => void
}

export function WbsImportDriveView({
  csvText,
  isImporting,
  isConnected,
  handleDriveConnect
}: WbsImportDriveViewProps) {
  return (
    <div className="border border-app-border rounded-xl p-8 text-center bg-app-muted-surface/50 mb-6">
      <Cloud className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
      <p className="text-sm font-medium text-app-fg mb-1">Select from Google Drive</p>
      <p className="text-xs text-app-subtle mb-4">Securely pick a CSV or Sheet straight from your Drive</p>
      <button 
        onClick={handleDriveConnect}
        disabled={isImporting}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
      >
        {isImporting ? 'Loading...' : isConnected ? 'Select File' : 'Connect & Select File'}
      </button>
      {csvText && <p className="mt-3 text-xs text-indigo-500 font-medium">File loaded. Ready to import.</p>}
    </div>
  )
}
