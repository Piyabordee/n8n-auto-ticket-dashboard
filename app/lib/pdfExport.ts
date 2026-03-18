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

// RGB equivalents for oklch colors in Tailwind config
const RGB_COLORS: Record<string, string> = {
  // Primary colors
  '--tw-primary-opacity': '1',
  '--primary': 'rgb(79, 70, 229)',
  '--primary-50': 'rgb(238, 242, 255)',
  '--primary-100': 'rgb(224, 231, 255)',
  '--primary-200': 'rgb(199, 210, 254)',
  '--primary-300': 'rgb(165, 180, 252)',
  '--primary-400': 'rgb(129, 140, 248)',
  '--primary-500': 'rgb(99, 102, 241)',
  '--primary-600': 'rgb(79, 70, 229)',
  '--primary-700': 'rgb(67, 56, 202)',
  '--primary-800': 'rgb(55, 48, 163)',
  '--primary-900': 'rgb(49, 46, 129)',
  '--primary-950': 'rgb(30, 27, 75)',
}

/**
 * Add RGB color override styles to element
 */
function addRGBOverrideStyles(element: HTMLElement): void {
  const styleId = 'pdf-rgb-override'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  // Create CSS that overrides oklch with RGB
  let css = `
    .pdf-export-container * {
      color: rgb(0, 0, 0) !important;
      background-color: transparent !important;
      border-color: rgb(200, 200, 200) !important;
    }
  `

  styleEl.textContent = css
}

/**
 * Remove RGB override styles
 */
function removeRGBOverrideStyles(): void {
  const styleEl = document.getElementById('pdf-rgb-override')
  if (styleEl) {
    styleEl.remove()
  }
}

/**
 * Prepare element for PDF capture
 */
function prepareElementForCapture(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement
  clone.className = 'pdf-export-container ' + clone.className
  clone.style.width = '794px'
  clone.style.position = 'absolute'
  clone.style.left = '-9999px'
  clone.style.top = '0'
  clone.style.visibility = 'visible'
  clone.style.backgroundColor = '#ffffff'
  document.body.appendChild(clone)

  // Override all colors with safe values
  const allElements = clone.querySelectorAll('*')
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const computed = window.getComputedStyle(el)

    // Get computed colors (browser returns RGB even for oklch)
    const color = computed.color
    const bgColor = computed.backgroundColor
    const borderColor = computed.borderColor

    // Set inline styles with computed values
    if (color && color !== 'rgba(0, 0, 0, 0)') {
      htmlEl.style.color = color
    }
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      htmlEl.style.backgroundColor = bgColor
    }
    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'transparent') {
      htmlEl.style.borderColor = borderColor
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
