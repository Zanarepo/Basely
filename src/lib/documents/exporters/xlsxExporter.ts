import * as XLSX from 'xlsx'

/**
 * Generate Excel (.xlsx) for WBS Dictionary or RACI Matrix
 */
export async function generateExcelExport(payload: {
  documentType: 'wbs_dictionary' | 'raci_matrix'
  projectName: string
  wbsElements?: any[]
  stakeholders?: any[]
}): Promise<{ fileName: string; base64: string }> {
  const wb = XLSX.utils.book_new()
  const cleanProjName = payload.projectName.replace(/[^a-zA-Z0-9_-]/g, '_')

  if (payload.documentType === 'wbs_dictionary') {
    const fileName = `${cleanProjName}_WBS_Dictionary.xlsx`
    const rows = (payload.wbsElements || []).map((el: any) => {
      const isWorkPackage = Boolean(el.isWorkPackage)
      const isMilestone = isWorkPackage && (el.duration === 0 || el.duration === '0d')
      const typeLabel = isMilestone ? 'Milestone' : isWorkPackage ? 'Work Package' : 'Summary Element'

      const durationText = isWorkPackage
        ? (el.duration !== undefined && el.duration !== null ? `${el.duration}d` : '—')
        : '—'

      const rName = el.raciAssignments?.find((a: any) => a.roleType === 'Responsible')?.stakeholder?.name || '—'
      const aName = el.raciAssignments?.find((a: any) => a.roleType === 'Accountable')?.stakeholder?.name || '—'

      return {
        'WBS Code': el.code || '—',
        'Element Name': el.name || '—',
        'Type': typeLabel,
        'Status': el.status || 'Not Started',
        'Duration': durationText,
        'Start Date': el.start || '—',
        'Finish Date': el.finish || '—',
        'Float': el.float ?? '—',
        'Budget Total': el.cost !== null && el.cost !== undefined ? `${el.currency || 'USD'} ${el.cost}` : '—',
        'Responsible (R)': rName,
        'Accountable (A)': aName,
        'Deliverables': el.deliverables || '—',
        'Acceptance Criteria': el.acceptanceCriteria || '—'
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)

    // Auto-fit column widths
    const colWidths = [
      { wch: 12 }, // Code
      { wch: 32 }, // Name
      { wch: 18 }, // Type
      { wch: 14 }, // Status
      { wch: 12 }, // Duration
      { wch: 14 }, // Start
      { wch: 14 }, // Finish
      { wch: 10 }, // Float
      { wch: 16 }, // Budget
      { wch: 24 }, // Responsible
      { wch: 24 }, // Accountable
      { wch: 35 }, // Deliverables
      { wch: 35 }  // Criteria
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'WBS Dictionary')
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
    return { fileName, base64 }

  } else if (payload.documentType === 'raci_matrix') {
    const fileName = `${cleanProjName}_RACI_Matrix.xlsx`
    const stakeholders = payload.stakeholders || []
    const elements = payload.wbsElements || []

    // Build headers: WBS Code, Element Name, [Stakeholder 1], [Stakeholder 2], ...
    const matrixRows = elements.map((el: any) => {
      const isWorkPackage = Boolean(el.isWorkPackage)
      const isMilestone = isWorkPackage && (el.duration === 0 || el.duration === '0d')
      const typeLabel = isMilestone ? 'Milestone' : isWorkPackage ? 'Work Package' : 'Summary Element'

      const rowObj: Record<string, string> = {
        'WBS Code': el.code || '—',
        'Element Name': el.name || '—',
        'Type': typeLabel
      }

      stakeholders.forEach((sh: any) => {
        const roles: string[] = []
        el.raciAssignments?.forEach((assign: any) => {
          if (assign.stakeholderId === sh.id || assign.stakeholder?.id === sh.id) {
            switch (assign.roleType) {
              case 'Responsible': roles.push('R'); break;
              case 'Accountable': roles.push('A'); break;
              case 'Consulted': roles.push('C'); break;
              case 'Informed': roles.push('I'); break;
            }
          }
        })
        rowObj[sh.name] = roles.join(', ') || '—'
      })

      return rowObj
    })

    const ws = XLSX.utils.json_to_sheet(matrixRows)

    const colWidths = [
      { wch: 12 },
      { wch: 32 },
      { wch: 18 },
      ...stakeholders.map(() => ({ wch: 20 }))
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'RACI Matrix')
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
    return { fileName, base64 }
  }

  throw new Error(`Excel export not supported for document type: ${payload.documentType}`)
}
