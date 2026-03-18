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

    // Create canvas from the page element
    const canvas = await html2canvas(page, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
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
