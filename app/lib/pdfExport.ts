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

// Unique ID for PDF export wrapper
const PDF_WRAPPER_ID = '__pdf_export_wrapper__'

/**
 * Get PDF-specific styles - scoped to wrapper only
 */
function getPDFStyles(): string {
  return `
    #${PDF_WRAPPER_ID} {
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

    #${PDF_WRAPPER_ID} * {
      box-sizing: border-box !important;
    }

    /* Ensure all text is visible - SCOPED to wrapper only */
    #${PDF_WRAPPER_ID} text,
    #${PDF_WRAPPER_ID} tspan {
      visibility: visible !important;
      display: block !important;
      opacity: 1 !important;
    }

    /* Recharts specific styles - SCOPED to wrapper only */
    #${PDF_WRAPPER_ID} .recharts-text,
    #${PDF_WRAPPER_ID} .recharts-label {
      visibility: visible !important;
      opacity: 1 !important;
      fill: currentColor !important;
    }

    #${PDF_WRAPPER_ID} .recharts-pie-label-text,
    #${PDF_WRAPPER_ID} .recharts-pie-label-line {
      visibility: visible !important;
      opacity: 1 !important;
      stroke-width: 1 !important;
    }

    /* SVG styles - SCOPED to wrapper only */
    #${PDF_WRAPPER_ID} svg {
      overflow: visible !important;
    }

    #${PDF_WRAPPER_ID} svg text {
      font-family: sans-serif !important;
      font-size: 12px !important;
      fill: #374151 !important;
    }

    #${PDF_WRAPPER_ID} .no-print {
      display: none !important;
    }
  `
}

/**
 * Prepare a single page for PDF capture
 */
function preparePageForCapture(page: HTMLElement): HTMLElement {
  // Create a unique wrapper div
  const wrapper = document.createElement('div')
  wrapper.id = PDF_WRAPPER_ID

  // Clone the page content
  const clone = page.cloneNode(true)

  // Copy all content from the cloned page to wrapper
  while (clone.firstChild) {
    wrapper.appendChild(clone.firstChild)
  }

  document.body.appendChild(wrapper)

  // Remove no-print elements from wrapper only
  const noPrintElements = wrapper.querySelectorAll('.no-print')
  noPrintElements.forEach(el => el.remove())

  return wrapper
}

/**
 * Clean up wrapper
 */
function cleanupWrapper(wrapper: HTMLElement): void {
  if (wrapper && wrapper.parentNode) {
    wrapper.parentNode.removeChild(wrapper)
  }
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

  // Create temporary style element scoped to wrapper
  const styleEl = document.createElement('style')
  styleEl.textContent = getPDFStyles()
  document.head.appendChild(styleEl)

  try {
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
            foreignObjectRendering: false,
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
        cleanupWrapper(wrapper)
      }
    }

    pdf.save(filename)
  } finally {
    // Always remove the style element
    if (styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl)
    }
  }
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
