import { useState } from 'react'
import { bulkImportWbsElements } from '@/lib/wbs/actions'

export type ImportSummary = {
  success: number
  failed: number
  errors: string[]
}

interface UseCsvParserProps {
  projectId: string
  csvText: string
  setIsImporting: (isImporting: boolean) => void
}

export function useCsvParser({ projectId, csvText, setIsImporting }: UseCsvParserProps) {
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  const handleImport = async () => {
    if (!csvText.trim()) return
    setIsImporting(true)
    setImportSummary(null)

    try {
      const rows = csvText.split('\n').map((r) => r.trim()).filter(Boolean)
      if (rows.length < 2) throw new Error('CSV must contain a header row and at least one data row.')

      const headers = rows[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
      
      const idxName = headers.findIndex((h) => h.includes('name') || h === 'task')
      const idxWbs = headers.findIndex((h) => h.includes('wbs'))
      const idxType = headers.findIndex((h) => h.includes('type'))

      if (idxName < 0) {
        throw new Error('CSV must include a "Task Name" or "Name" column.')
      }

      const toImport: any[] = []
      const errors: string[] = []
      let success = 0
      let failed = 0

      // We will parse into a flat list, generating UUIDs
      const parsedElements = []
      
      for (let i = 1; i < rows.length; i++) {
        const rawCols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        const cols = rawCols.map((c) => c.trim().replace(/^"|"$/g, ''))
        
        if (cols.length <= idxName || !cols[idxName]) continue

        const rawName = rawCols[idxName].replace(/^"|"$/g, '')
        const indentLevel = rawName.match(/^\s*/)?.[0].length || 0

        parsedElements.push({
          rowNum: i + 1,
          name: cols[idxName],
          wbsCode: idxWbs >= 0 ? cols[idxWbs] : '',
          type: idxType >= 0 ? cols[idxType].toLowerCase() : '',
          indent: indentLevel,
          id: crypto.randomUUID()
        })
      }

      let hierarchyStack: { id: string, indent: number }[] = []
      let sortOrderCounter = 1000
      
      // Map to link codes to UUIDs if codes are present
      const codeToIdMap = new Map<string, string>()
      const hasCodes = parsedElements.some((e) => e.wbsCode)

      for (const el of parsedElements) {
        let parentId: string | null = null
        let sortOrder = 0
        let isWorkPackage = false

        if (hasCodes && el.wbsCode) {
          codeToIdMap.set(el.wbsCode, el.id)
          const parts = el.wbsCode.split('.')
          if (parts.length > 1) {
            const parentCode = parts.slice(0, -1).join('.')
            parentId = codeToIdMap.get(parentCode) || null
          }
          sortOrder = parseInt(parts[parts.length - 1], 10) * 1000 || 1000
          isWorkPackage = el.type === 'task' || el.type === 'work package'
        } else {
          // Smart parsing based on indentation or type
          if (el.indent > 0 || hierarchyStack.length > 0) {
            // Indentation-based hierarchy
            while (hierarchyStack.length > 0 && hierarchyStack[hierarchyStack.length - 1].indent >= el.indent) {
              hierarchyStack.pop()
            }
            if (hierarchyStack.length > 0) {
              parentId = hierarchyStack[hierarchyStack.length - 1].id
            }
            hierarchyStack.push({ id: el.id, indent: el.indent })
            sortOrder = sortOrderCounter
            sortOrderCounter += 1000
            isWorkPackage = el.type === 'task' || el.type === 'work package' || el.type === ''
          } else {
            // Type-based hierarchy fallback
            if (el.type === 'summary') {
              hierarchyStack = [{ id: el.id, indent: 0 }]
              sortOrder = sortOrderCounter
              sortOrderCounter += 1000
              isWorkPackage = false
            } else {
              parentId = hierarchyStack.length > 0 ? hierarchyStack[0].id : null
              sortOrder = sortOrderCounter
              sortOrderCounter += 1000
              isWorkPackage = true
            }
          }
        }

        toImport.push({
          id: el.id,
          project_id: projectId,
          parent_id: parentId,
          name: el.name,
          is_work_package: isWorkPackage,
          sort_order: sortOrder,
          status: 'Not Started'
        })
        success++
      }

      if (toImport.length > 0) {
        const res = await bulkImportWbsElements(projectId, toImport)
        if (!res.ok) throw new Error(res.error)
      } else {
        throw new Error('No valid rows found to import.')
      }

      setImportSummary({ success, failed, errors })
    } catch (err: any) {
      alert(err.message || 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  return { importSummary, setImportSummary, handleImport }
}
