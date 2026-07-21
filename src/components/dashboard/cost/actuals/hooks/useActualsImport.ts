import { useState } from 'react'
import type { WbsCostData } from '@/lib/cost/types'
import { bulkImportActualCosts } from '@/lib/actuals/actions'

export type ImportSummary = {
  success: number
  failed: number
  errors: string[]
}

interface UseActualsImportProps {
  wbsCostData: WbsCostData[]
  projectCurrency: string
  csvText: string
  onDataChange: () => void
}

export function useActualsImport({ wbsCostData, projectCurrency, csvText, onDataChange }: UseActualsImportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  const handleImport = async () => {
    if (!csvText.trim()) return
    setIsSaving(true)
    setImportSummary(null)
    try {
      const rows = csvText.split('\n').map((r) => r.trim()).filter(Boolean)
      const headers = rows[0].split(',').map((h) => h.trim().toLowerCase())
      
      const idxWbs = headers.indexOf('wbs code') >= 0 ? headers.indexOf('wbs code') : headers.indexOf('wbs')
      const idxAmount = headers.indexOf('amount')
      const idxDate = headers.indexOf('date')
      const idxDesc = headers.indexOf('description')

      if (idxWbs < 0 || idxAmount < 0 || idxDate < 0) {
        throw new Error('CSV must include "WBS" (or "WBS Code"), "Amount", and "Date" columns.')
      }

      const toImport = []
      const errors: string[] = []
      let success = 0
      let failed = 0

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map((c) => c.trim())
        if (cols.length < 3) continue

        const wbsCode = cols[idxWbs]
        const amount = parseFloat(cols[idxAmount])
        const date = cols[idxDate]
        const desc = idxDesc >= 0 ? cols[idxDesc] : ''

        const wbsMatch = wbsCostData.find((w) => w.wbsCode === wbsCode)

        if (!wbsMatch) {
          failed++
          errors.push(`Row ${i + 1}: WBS Code "${wbsCode}" not found.`)
          continue
        }

        if (isNaN(amount)) {
          failed++
          errors.push(`Row ${i + 1}: Invalid amount "${cols[idxAmount]}".`)
          continue
        }

        toImport.push({
          wbs_element_id: wbsMatch.wbsId,
          amount,
          currency: projectCurrency,
          date,
          description: desc
        })
        success++
      }

      if (toImport.length > 0) {
        await bulkImportActualCosts(toImport)
        onDataChange()
      }

      setImportSummary({ success, failed, errors })
      if (failed === 0) {
        setTimeout(() => setIsImporting(false), 3000)
      }
    } catch (err: any) {
      alert(err.message || 'Import failed')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    isImporting,
    setIsImporting,
    isSaving,
    setIsSaving,
    importSummary,
    setImportSummary,
    handleImport
  }
}
