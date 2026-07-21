import { useState } from 'react'
import { getFullProjectExportData, logDocumentExport } from '@/lib/documents/exportActions'
import { generatePdfExport } from '@/lib/documents/exporters/pdfExporter'
import { generateDocxExport } from '@/lib/documents/exporters/docxExporter'
import { generateExcelExport } from '@/lib/documents/exporters/xlsxExporter'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/actions'

interface UseDocumentExportsProps {
  projectId: string
  projectContext: any
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  freeText: Record<string, string>
  periodEnd: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function useDocumentExports({
  projectId,
  projectContext,
  template,
  generatedDoc,
  freeText,
  periodEnd,
  onShowToast
}: UseDocumentExportsProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'docx' | 'xlsx' | null>(null)

  const fetchStructuredDataForExport = async () => {
    const data = await getFullProjectExportData(projectId)
    return { wbsElements: data.wbsElements, stakeholders: data.stakeholders }
  }

  const handleExportPdf = async () => {
    setShowExportMenu(false)
    setExportingFormat('pdf')
    try {
      const cleanProjName = (projectContext?.name || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_')
      const docLabel = template.document_type.toUpperCase().replace('_', '_')
      const fileName = `${cleanProjName}_${docLabel}.pdf`

      const { base64 } = await generatePdfExport('document-printable-area', fileName)

      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      await logDocumentExport({
        projectId,
        generatedDocumentId: generatedDoc?.id,
        documentType: template.document_type,
        format: 'pdf',
        fileName,
        fileContentBase64: base64,
        contentSnapshot: { freeText, periodEnd }
      })

      onShowToast('success', `Exported ${fileName}`)
    } catch (err: any) {
      console.error('PDF export error:', err)
      onShowToast('error', err.message || 'PDF export failed')
    } finally {
      setExportingFormat(null)
    }
  }

  const handleExportDocx = async () => {
    setShowExportMenu(false)
    setExportingFormat('docx')
    try {
      const exportData = await getFullProjectExportData(projectId)
      const { fileName, base64 } = await generateDocxExport({
        documentType: template.document_type,
        projectName: projectContext?.name || 'Project',
        template,
        freeTextContent: freeText,
        projectContext,
        wbsElements: exportData.wbsElements,
        stakeholders: exportData.stakeholders,
        evmData: exportData.evmData,
        topRisks: exportData.topRisks,
        scheduleSummary: exportData.scheduleSummary
      })

      const link = document.createElement('a')
      link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      await logDocumentExport({
        projectId,
        generatedDocumentId: generatedDoc?.id,
        documentType: template.document_type,
        format: 'docx',
        fileName,
        fileContentBase64: base64,
        contentSnapshot: { freeText }
      })

      onShowToast('success', `Exported ${fileName}`)
    } catch (err: any) {
      console.error('DOCX export error:', err)
      onShowToast('error', err.message || 'Word export failed')
    } finally {
      setExportingFormat(null)
    }
  }

  const handleExportXlsx = async () => {
    setShowExportMenu(false)
    setExportingFormat('xlsx')
    try {
      const { wbsElements, stakeholders } = await fetchStructuredDataForExport()
      const { fileName, base64 } = await generateExcelExport({
        documentType: template.document_type as any,
        projectName: projectContext?.name || 'Project',
        wbsElements,
        stakeholders
      })

      const link = document.createElement('a')
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      await logDocumentExport({
        projectId,
        generatedDocumentId: generatedDoc?.id,
        documentType: template.document_type,
        format: 'xlsx',
        fileName,
        fileContentBase64: base64,
        contentSnapshot: { itemCount: wbsElements.length }
      })

      onShowToast('success', `Exported ${fileName}`)
    } catch (err: any) {
      console.error('XLSX export error:', err)
      onShowToast('error', err.message || 'Excel export failed')
    } finally {
      setExportingFormat(null)
    }
  }

  return {
    showExportMenu,
    setShowExportMenu,
    exportingFormat,
    handleExportPdf,
    handleExportDocx,
    handleExportXlsx
  }
}
