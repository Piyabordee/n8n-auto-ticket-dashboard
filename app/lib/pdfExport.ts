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
 * Convert oklch colors to computed hex values before PDF export
 * This is a workaround for html2canvas not supporting oklch/lab colors
 */
function forceComputeColors(element: HTMLElement): void {
  // Force the browser to compute all oklch colors to RGB
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const computedStyle = window.getComputedStyle(node)
        const color = computedStyle.color
        const backgroundColor = computedStyle.backgroundColor
        const borderColor = computedStyle.borderColor

        // Check if any property uses lab/oklch
        const usesLab = [
          color,
          backgroundColor,
          borderColor,
          computedStyle.borderTopColor,
          computedStyle.borderRightColor,
          computedStyle.borderBottomColor,
          computedStyle.borderLeftColor
        ].some(c => c && c.includes('lab'))

        return usesLab ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      }
    }
  )

  const node = walker.nextNode()
  while (node) {
    const el = node as HTMLElement
    const computed = window.getComputedStyle(el)

    // Force color computation by setting inline styles
    if (computed.color && computed.color.includes('lab')) {
      (el as HTMLElement).style.color = computed.color
    }
    if (computed.backgroundColor && computed.backgroundColor.includes('lab')) {
      (el as HTMLElement).style.backgroundColor = computed.backgroundColor
    }

    walker.nextNode()
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

    // Force compute oklch colors to RGB before capture
    forceComputeColors(page)

    // Create canvas from the page element
    const canvas = await html2canvas(page, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      // Use foreignObjectRendering for better SVG support
      foreignObjectRendering: true
    })

    const imgWidth = A4_WIDTH - (2 * MARGIN)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Add new page (except for the first one)
    if (i > 0) {
      pdf.addPage()
    }

    // Add the image to the PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight)
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
