import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ImportSummary } from './hooks/useCsvParser'

interface WbsImportSummaryProps {
  importSummary: ImportSummary
}

export function WbsImportSummary({ importSummary }: WbsImportSummaryProps) {
  return (
    <div className={`p-4 mb-6 rounded-xl border ${importSummary.failed > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'}`}>
      <div className="flex items-center gap-2 mb-2">
        {importSummary.failed > 0 ? <AlertCircle className="w-5 h-5 text-amber-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        <span className="font-bold text-app-fg">Import Complete</span>
      </div>
      <p className="text-sm text-app-fg mb-1">{importSummary.success} rows imported successfully.</p>
      {importSummary.failed > 0 && (
        <div className="mt-2">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">{importSummary.failed} rows failed validation:</p>
          <ul className="text-xs text-amber-600 dark:text-amber-500 list-disc pl-5 max-h-32 overflow-y-auto">
            {importSummary.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
