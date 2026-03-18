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

// A4 width in pixels at 96 DPI
const A4_WIDTH_PX = 794
const CONTENT_WIDTH = 754 // A4_WIDTH_PX - 40px padding

/**
 * Inject PDF-specific styles
 */
function injectPDFStyles(): HTMLStyleElement {
  const styleId = 'pdf-export-styles'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = `
    .pdf-export-wrapper {
      width: ${A4_WIDTH_PX}px !important;
      min-height: ${A4_HEIGHT_PX}px !important;
      position: absolute !important;
      left: -9999px !important;
      top: 0 !important;
      background: #ffffff !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    .pdf-export-wrapper .report-page {
      width: 100% !important;
      min-height: ${A4_HEIGHT_PX}px !important;
      padding: 24px !important;
      background: #ffffff !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      page-break-after: always !important;
    }

    .pdf-export-wrapper * {
      box-sizing: border-box !important;
    }

    .pdf-export-wrapper h1,
    .pdf-export-wrapper h2,
    .pdf-export-wrapper h3,
    .pdf-export-wrapper h4,
    .pdf-export-wrapper h5,
    .pdf-export-wrapper h6 {
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
    }

    .pdf-export-wrapper p,
    .pdf-export-wrapper span,
    .pdf-export-wrapper div {
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
    }

    .pdf-export-wrapper .recharts-wrapper {
      overflow: visible !important;
    }

    .pdf-export-wrapper svg {
      overflow: visible !important;
    }

    .pdf-export-wrapper .recharts-text {
      overflow: visible !important;
      text-anchor: middle !important;
    }

    .no-print {
      display: none !important;
    }
  `

  return styleEl
}

/**
 * Remove PDF-specific styles
 */
function removePDFStyles(): void {
  const styleEl = document.getElementById('pdf-export-styles')
  if (styleEl) {
    styleEl.remove()
  }
}

/**
 * Prepare element for PDF capture with proper A4 sizing
 */
function prepareElementForCapture(element: HTMLElement): HTMLElement {
  // Inject PDF styles
  injectPDFStyles()

  const clone = element.cloneNode(true) as HTMLElement
  clone.className = 'pdf-export-wrapper ' + clone.className

  document.body.appendChild(clone)

  // Remove no-print elements
  const noPrintElements = clone.querySelectorAll('.no-print')
  noPrintElements.forEach(el => el.remove())

  // Force images to load
  const images = clone.querySelectorAll('img')
  images.forEach(img => {
    if (img instanceof HTMLImageElement) {
      img.style.display = 'block'
    }
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
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 200))

      const canvas = await Promise.race([
        html2canvas(preparedElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
          onclone: (clonedDoc) => {
            // Ensure all text is visible
            const textElements = clonedDoc.querySelectorAll('*')
            textElements.forEach(el => {
              const htmlEl = el as HTMLElement
              htmlEl.style.overflow = 'visible'
              htmlEl.style.textOverflow = 'clip'
            })
          },
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
      removePDFStyles()
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
