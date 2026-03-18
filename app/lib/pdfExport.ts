/**
 * PDF Export Utility for Monthly Report
 * Uses jsPDF and html2canvas to generate multi-page PDFs
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PdfExportOptions {
  filename: string
  onProgress?: (progress: number) => void
}

const A4_WIDTH = 210 // mm
const A4_HEIGHT = 297 // mm
const MARGIN = 10 // mm

/**
 * Export the report content to PDF
 */
export async function exportToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const { filename, onProgress } = options

  const pages = element.querySelectorAll('.report-page')
  const totalPages = pages.length

  if (totalPages === 0) {
    throw new Error('No report pages to export')
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i] as HTMLElement
    onProgress?.(Math.round(((i + 1) / totalPages) * 100))

    const canvas = await Promise.race([
      html2canvas(page, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        ignoreElements: (el) => {
          return el.classList?.contains('recharts-tooltip-wrapper') ||
                 el.classList?.contains('recharts-tooltip')
        }
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF export timeout')), 15000)
      )
    ])

    const imgWidth = A4_WIDTH - (2 * MARGIN)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    if (i > 0) {
      pdf.addPage()
    }

    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight)
  }

  pdf.save(filename)
}

/**
 * Generate filename based on year and month
 */
export function generateReportFilename(year: number, month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthName = monthNames[month - 1]
  const date = new Date()
  const timestamp = date.toISOString().split('T')[0]

  return `monthly-report-${monthName}-${year}-${timestamp}.pdf`
}
