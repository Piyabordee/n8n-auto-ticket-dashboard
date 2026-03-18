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

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

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
    .pdf-export-page-wrapper {
      position: absolute !important;
      left: -9999px !important;
      top: 0 !important;
      width: ${A4_WIDTH_PX}px !important;
      min-height: ${A4_HEIGHT_PX}px !important;
      background: #ffffff !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      z-index: 9999 !important;
    }

    .pdf-export-page-wrapper * {
      box-sizing: border-box !important;
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
    }

    .pdf-export-page-wrapper h1,
    .pdf-export-page-wrapper h2,
    .pdf-export-page-wrapper h3,
    .pdf-export-page-wrapper h4,
    .pdf-export-page-wrapper h5,
    .pdf-export-page-wrapper h6 {
      overflow: visible !important;
      text-overflow: clip !important;
      white-space: normal !important;
      line-height: 1.2 !important;
    }

    .pdf-export-page-wrapper p,
    .pdf-export-page-wrapper span,
    .pdf-export-page-wrapper li,
    .pdf-export-page-wrapper td {
      overflow: visible !important;
      text-overflow: clip !important;
    }

    .pdf-export-page-wrapper .recharts-wrapper,
    .pdf-export-page-wrapper .recharts-surface {
      overflow: visible !important;
    }

    .pdf-export-page-wrapper svg {
      overflow: visible !important;
    }

    .pdf-export-page-wrapper .recharts-text {
      overflow: visible !important;
      text-anchor: middle !important;
    }

    .pdf-export-page-wrapper .recharts-legend-wrapper {
      overflow: visible !important;
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
 * Prepare a single page for PDF capture
 */
function preparePageForCapture(page: HTMLElement): HTMLElement {
  // Inject PDF styles
  injectPDFStyles()

  // Clone the page content (not the wrapper)
  const clone = page.cloneNode(true) as HTMLElement

  // Create a wrapper div
  const wrapper = document.createElement('div')
  wrapper.className = 'pdf-export-page-wrapper'

  // Copy all content from the cloned page to wrapper
  while (clone.firstChild) {
    wrapper.appendChild(clone.firstChild)
  }

  document.body.appendChild(wrapper)

  // Remove no-print elements
  const noPrintElements = wrapper.querySelectorAll('.no-print')
  noPrintElements.forEach(el => el.remove())

  return wrapper
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

    const wrapper = preparePageForCapture(page)

    try {
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 300))

      const canvas = await Promise.race([
        html2canvas(wrapper, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
          ignoreElements: (el) => {
            return el.classList?.contains('recharts-tooltip-wrapper') ||
                   el.classList?.contains('recharts-tooltip')
          }
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF export timeout')), 25000)
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
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper)
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
