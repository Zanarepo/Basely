import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

/**
 * Generate high-fidelity PDF by rendering the document DOM element.
 * Handles textareas, input fields, dark mode variables, and multi-page layouts cleanly.
 */
export async function generatePdfExport(
  elementId: string,
  fileName: string
): Promise<{ fileName: string; base64: string }> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element #${elementId} not found for PDF export`)
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
    onclone: (clonedDoc) => {
      // 1. Force light theme & exact color rendering
      const styleEl = clonedDoc.createElement('style')
      styleEl.innerHTML = `
        * {
          color-scheme: light !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .dark {
          color-scheme: light !important;
        }
        body {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
      `
      clonedDoc.head.appendChild(styleEl)

      // 2. Replace <textarea> input elements with static text <div> blocks so user inputs render into PDF
      const textareas = clonedDoc.querySelectorAll('textarea')
      textareas.forEach((ta) => {
        const textDiv = clonedDoc.createElement('div')
        textDiv.style.cssText = 'padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #0f172a; white-space: pre-wrap; font-family: inherit; width: 100%; min-height: 80px;'
        textDiv.textContent = ta.value || (ta as HTMLTextAreaElement).placeholder || 'No content entered.'
        ta.parentNode?.replaceChild(textDiv, ta)
      })

      // 3. Replace <input> fields with text spans
      const inputs = clonedDoc.querySelectorAll('input')
      inputs.forEach((inp) => {
        if (inp.type === 'checkbox' || inp.type === 'radio') return
        const span = clonedDoc.createElement('span')
        span.style.cssText = 'font-size: 14px; color: #0f172a; font-weight: 600;'
        span.textContent = inp.value || ''
        inp.parentNode?.replaceChild(span, inp)
      })
    }
  })

  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF('p', 'mm', 'a4')

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pdfWidth - 20 // 10mm side margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 10

  // Page 1
  pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
  heightLeft -= (pdfHeight - 20)

  // Subsequent pages if long document
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
    heightLeft -= (pdfHeight - 20)
  }

  const base64 = pdf.output('datauristring').split(',')[1]
  return { fileName, base64 }
}
