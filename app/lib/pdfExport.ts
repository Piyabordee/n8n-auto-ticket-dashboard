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

// Color cache for oklch to RGB conversion
const colorCache = new Map<string, string>()

/**
 * Convert oklch/lab color to RGB by creating a temporary element
 */
function getComputedColor(colorValue: string): string {
  if (!colorValue || colorValue === 'transparent' || colorValue === 'none') {
    return colorValue
  }

  // Check cache first
  if (colorCache.has(colorValue)) {
    return colorCache.get(colorValue)!
  }

  // Already RGB/RGBA/HSL
  if (colorValue.startsWith('rgb') || colorValue.startsWith('#') || colorValue.startsWith('hsl')) {
    return colorValue
  }

  // Create temp element to get computed color
  const temp = document.createElement('div')
  temp.style.color = colorValue
  temp.style.display = 'none'
  document.documentElement.appendChild(temp)

  const computed = window.getComputedStyle(temp).color

  // Clean up
  if (temp.parentNode) {
    temp.parentNode.removeChild(temp)
  }

  // Cache the result
  colorCache.set(colorValue, computed)
  return computed
}

/**
 * Clone element and convert oklch/lab colors to RGB
 */
function prepareElementForCapture(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement

  clone.style.width = '794px'
  clone.style.position = 'absolute'
  clone.style.left = '-9999px'
  clone.style.top = '0'
  document.body.appendChild(clone)

  // Force all colors to be computed
  const allElements = clone.querySelectorAll('*')
  allElements.forEach((el) => {
    const computed = window.getComputedStyle(el)
    const htmlEl = el as HTMLElement

    const colorProps = ['color', 'backgroundColor', 'borderColor',
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'fill', 'stroke']

    colorProps.forEach(prop => {
      const value = computed.getPropertyValue(prop)
      if (value && (value.includes('oklch') || value.includes('lab'))) {
        const rgbColor = getComputedColor(value)
        if (rgbColor) {
          (htmlEl.style as any)[prop] = rgbColor
        }
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

      if (i > 0) {
        pdf.addPage()
      }

      const imgData = canvas.toDataURL('image/png')
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
