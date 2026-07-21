import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  ShadingType
} from 'docx'

export async function generateDocxExport(payload: {
  documentType: string
  projectName: string
  template: any
  freeTextContent?: Record<string, string>
  projectContext?: any
  wbsElements?: any[]
  stakeholders?: any[]
  evmData?: any
  topRisks?: any[]
  scheduleSummary?: any
  snapshotData?: any
}): Promise<{ fileName: string; base64: string }> {
  const cleanProjName = payload.projectName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const docTypeLabel = payload.documentType.toUpperCase().replace('_', ' ')
  const fileName = `${cleanProjName}_${docTypeLabel}.docx`

  const children: any[] = []

  // Document Title Header
  children.push(
    new Paragraph({
      text: `${payload.projectName}`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${docTypeLabel} DOCUMENT`,
          bold: true,
          color: '4F46E5',
          size: 24
        }),
        new TextRun({
          text: `  |  Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          italics: true,
          color: '6B7280',
          size: 20
        })
      ],
      spacing: { after: 360 }
    })
  )

  const template = payload.template
  const freeText = payload.freeTextContent || {}
  const ctx = payload.projectContext || {}
  const wbs = payload.wbsElements || []
  const stakeholders = payload.stakeholders || []
  const evm = payload.evmData
  const risks = payload.topRisks || []
  const sched = payload.scheduleSummary || {}

  if (template?.section_definitions && Array.isArray(template.section_definitions)) {
    for (const section of template.section_definitions) {
      // Section Heading
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 140 }
        })
      )

      if (section.type === 'free_text') {
        const textVal = freeText[section.key] || 'No content provided for this section.'
        const lines = textVal.split('\n')
        lines.forEach((line) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 22 })],
              spacing: { after: 120 }
            })
          )
        })
      } else if (section.type === 'data_bound') {
        if (section.source?.startsWith('project.')) {
          const field = section.source.split('.')[1]
          const val = ctx[field] || 'Not specified'
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: String(val), bold: true, size: 22 })
              ],
              spacing: { after: 200 }
            })
          )
        } else if (section.source === 'wbs.dictionary' || section.source === 'wbs.prototype' || section.source?.startsWith('wbs.')) {
          // Render detailed WBS Dictionary table in Word
          if (wbs.length > 0) {
            const tableHeaderRow = new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Code', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Element Name', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Type', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Duration', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Start', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Finish', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Responsible (R)', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Accountable (A)', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
              ]
            })

            const tableDataRows = wbs.map((el: any) => {
              const isMilestone = el.isWorkPackage && (el.duration === 0 || el.duration === '0d')
              const typeLabel = isMilestone ? 'Milestone' : el.isWorkPackage ? 'Work Package' : 'Summary Element'
              const durationText = el.isWorkPackage ? (el.duration !== undefined && el.duration !== null ? `${el.duration}d` : '—') : '—'

              const rName = el.raciAssignments?.find((a: any) => a.roleType === 'Responsible')?.stakeholder?.name || '—'
              const aName = el.raciAssignments?.find((a: any) => a.roleType === 'Accountable')?.stakeholder?.name || '—'

              return new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: el.code || '—', bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: el.name || '—', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: typeLabel, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: el.status || 'Not Started', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: durationText, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: el.start || '—', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: el.finish || '—', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: rName, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: aName, size: 18 })] })] }),
                ]
              })
            })

            children.push(
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [tableHeaderRow, ...tableDataRows]
              })
            )
          } else {
            children.push(new Paragraph({ children: [new TextRun({ text: 'No WBS elements recorded.', italics: true })] }))
          }
        } else if (section.source === 'raci.matrix') {
          // Render RACI Matrix table in Word
          if (wbs.length > 0 && stakeholders.length > 0) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'RACI Roles: ', bold: true, size: 19 }),
                  new TextRun({ text: 'R = Responsible  |  A = Accountable  |  C = Consulted  |  I = Informed', italics: true, color: '6B7280', size: 19 })
                ],
                spacing: { after: 140 }
              })
            )

            const headerCells = [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'WBS Element', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
              ...stakeholders.map((sh: any) =>
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sh.name, bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } })
              )
            ]

            const dataRows = wbs.filter((el: any) => el.isWorkPackage && (el.duration === undefined || el.duration !== 0)).map((el: any) =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${el.code} - ${el.name}`, size: 18 })] })] }),
                  ...stakeholders.map((sh: any) => {
                    const roles = (el.raciAssignments || [])
                      .filter((a: any) => a.stakeholderId === sh.id || a.stakeholder?.id === sh.id)
                      .map((a: any) => a.roleType[0])
                      .join(', ')
                    return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: roles || '—', bold: !!roles, size: 18 })], alignment: AlignmentType.CENTER })] })
                  })
                ]
              })
            )

            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: headerCells }), ...dataRows] }))
          } else {
            children.push(new Paragraph({ children: [new TextRun({ text: 'No RACI matrix assignments recorded.', italics: true })] }))
          }
        } else if (section.source === 'status.schedule') {
          // Render Schedule Status details for Status Report
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `Schedule Completion: `, bold: true, size: 20 }),
                new TextRun({ text: `${sched.overallComplete || 0}%`, bold: true, color: '4F46E5', size: 22 }),
                new TextRun({ text: `  |  Critical Path Health: `, bold: true, size: 20 }),
                new TextRun({ text: `${sched.criticalPathHealth || 'On Track'}`, bold: true, color: sched.criticalPathHealth === 'At Risk' ? 'F59E0B' : '10B981', size: 20 })
              ],
              spacing: { after: 180 }
            })
          )

          if (sched.upcomingMilestones && sched.upcomingMilestones.length > 0) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: 'Upcoming Milestones:', bold: true, size: 19 })],
                spacing: { after: 100 }
              })
            )
            const msRows = [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Milestone Name', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Target Date', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } })
                ]
              }),
              ...sched.upcomingMilestones.map((m: any) =>
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m.name, size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m.status || 'Not Started', size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m.finish || m.start || '—', size: 18 })] })] })
                  ]
                })
              )
            ]
            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: msRows }))
          } else {
            children.push(new Paragraph({ children: [new TextRun({ text: 'No upcoming milestones scheduled.', italics: true })], spacing: { after: 180 } }))
          }

        } else if (section.source === 'status.cost') {
          // Render Cost & EVM Status metrics for Status Report
          if (evm) {
            const fmtCurr = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0)
            const fmtIdx = (v: number) => (v || 0).toFixed(2)

            const evmHeader = new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Health Indicator', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } })
              ]
            })

            const evmRows = [
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: 'CPI (Cost Performance Index)' })] }), new TableCell({ children: [new Paragraph({ text: fmtIdx(evm.cpi) })] }), new TableCell({ children: [new Paragraph({ text: evm.cpi >= 1 ? 'Under budget' : 'Over budget' })] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: 'SPI (Schedule Performance Index)' })] }), new TableCell({ children: [new Paragraph({ text: fmtIdx(evm.spi) })] }), new TableCell({ children: [new Paragraph({ text: evm.spi >= 1 ? 'Ahead of schedule' : 'Behind schedule' })] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: 'EAC (Estimate at Completion)' })] }), new TableCell({ children: [new Paragraph({ text: fmtCurr(evm.eac) })] }), new TableCell({ children: [new Paragraph({ text: `vs BAC ${fmtCurr(evm.bac)}` })] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: 'VAC (Variance at Completion)' })] }), new TableCell({ children: [new Paragraph({ text: fmtCurr(evm.vac) })] }), new TableCell({ children: [new Paragraph({ text: evm.vac >= 0 ? 'Projected Surplus' : 'Projected Deficit' })] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: 'Earned Value (EV)' })] }), new TableCell({ children: [new Paragraph({ text: fmtCurr(evm.ev) })] }), new TableCell({ children: [new Paragraph({ text: `PV: ${fmtCurr(evm.pv)}  |  AC: ${fmtCurr(evm.ac)}` })] })] })
            ]

            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [evmHeader, ...evmRows] }))
          } else {
            children.push(new Paragraph({ children: [new TextRun({ text: 'No EVM snapshot data recorded for this period.', italics: true })], spacing: { after: 180 } }))
          }

        } else if (section.source === 'status.risks') {
          // Render Top Risks table for Status Report
          if (risks.length > 0) {
            const riskHeader = new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Risk Title', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Category', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Score', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '4F46E5', type: ShadingType.CLEAR } })
              ]
            })

            const riskRows = risks.map((r: any) =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.title || '—', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.category || 'General', size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(r.score || 0), bold: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.status || 'Open', size: 18 })] })] })
                ]
              })
            )

            children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [riskHeader, ...riskRows] }))
          } else {
            children.push(new Paragraph({ children: [new TextRun({ text: 'No active top risks recorded.', italics: true })] }))
          }

        } else {
          children.push(new Paragraph({ children: [new TextRun({ text: `[Section: ${section.title}]`, italics: true })] }))
        }
      }
    }
  }

  const doc = new Document({
    sections: [{ children }]
  })

  const buffer = await Packer.toBuffer(doc)
  const base64 = buffer.toString('base64')

  return { fileName, base64 }
}
