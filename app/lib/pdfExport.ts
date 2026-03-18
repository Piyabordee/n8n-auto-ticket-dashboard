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

// A4 width in pixels at 96 DPI (for proper scaling)
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

/**
 * Prepare element for PDF capture with proper A4 sizing
 */
function prepareElementForCapture(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement

  // Set up container for A4 page proportions
  clone.style.width = `${A4_WIDTH_PX}px`
  clone.style.minHeight = `${A4_HEIGHT_PX}px`
  clone.style.position = 'absolute'
  clone.style.left = '-9999px'
  clone.style.top = '0'
  clone.style.backgroundColor = '#ffffff'
  clone.style.padding = '20px'
  clone.style.boxSizing = 'border-box'
  clone.style.overflow = 'visible'

  document.body.appendChild(clone)

  // Force text rendering to complete
  const images = clone.querySelectorAll('img')
  images.forEach(img => {
    img.style.display = 'block'
  })

  return clone
}

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

    const preparedElement = prepareElementForCapture(page)

    try {
      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await Promise.race([
        html2canvas(preparedElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
          ignoreElements: (el) => {
            return el.classList?.contains('recharts-tooltip-wrapper') ||
                   el.classList?.contains('recharts-tooltip')
          }
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF export timeout')), 20000)
        )
      ])

      const imgWidth = A4_WIDTH - (2 * MARGIN)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (i > 0) {
        pdf.addPage()
      }

      const imgData = canvas.toDataURL('image/png', 0.95)
      pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight)
    } finally {
      if (preparedElement.parentNode) {
        preparedElement.parentNode.removeChild(preparedElement)
      }
    }
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
