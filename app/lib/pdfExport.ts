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
 * Clone element and convert oklch/lab colors to RGB
 * This works around html2canvas not supporting oklch/lab colors
 */
function prepareElementForCapture(element: HTMLElement): HTMLElement {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as HTMLElement

  // Set a fixed width to match A4 proportions for better capture
  clone.style.width = '794px' // A4 width in pixels at 96dpi
  clone.style.position = 'absolute'
  clone.style.left = '-9999px'
  clone.style.top = '0'
  document.body.appendChild(clone)

  // Force all colors to be computed
  const allElements = clone.querySelectorAll('*')
  allElements.forEach((el) => {
    const computed = window.getComputedStyle(el)
    const htmlEl = el as HTMLElement

    // Force color computation for all color properties
    const colorProps = ['color', 'backgroundColor', 'borderColor',
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'textDecorationColor', 'fill', 'stroke']

    colorProps.forEach(prop => {
      const value = computed.getPropertyValue(prop)
      if (value && (value.includes('oklch') || value.includes('lab'))) {
        // Get the computed RGB value
        const temp = document.createElement('div')
        temp.style.color = value
        document.body.appendChild(temp)
        const computedColor = window.getComputedStyle(temp).color
        document.body.removeChild(temp)

        // Set the inline style with computed RGB
        (htmlEl.style as any)[prop] = computedColor
      }
    })
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

  // Get all report pages
  const pages = element.querySelectorAll('.report-page')
  const totalPages = pages.length

  if (totalPages === 0) {
    throw new Error('No report pages to export')
  }

  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Process each page
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i] as HTMLElement

    // Report progress
    onProgress?.(Math.round(((i + 1) / totalPages) * 100))

    // Prepare cloned element with computed colors
    const preparedElement = prepareElementForCapture(page)

    try {
      // Create canvas from the prepared element
      const canvas = await Promise.race([
        html2canvas(preparedElement, {
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
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PDF export timeout')), 15000)
        )
      ]) as any

      const imgWidth = A4_WIDTH - (2 * MARGIN)
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Add new page (except for the first one)
      if (i > 0) {
        pdf.addPage()
      }

      // Add the image to the PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight)
    } finally {
      // Clean up cloned element
      document.body.removeChild(preparedElement)
    }
  }

  // Save the PDF
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
  const timestamp = date.toISOString().split('T')[0] // YYYY-MM-DD

  return `monthly-report-${monthName}-${year}-${timestamp}.pdf`
}
