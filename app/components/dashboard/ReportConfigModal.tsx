'use client'

import { useState, useRef, useEffect } from 'react'
import type { ReportSectionConfig } from '@/lib/reportSections'
import {
  loadCustomNames,
  saveCustomNames,
  resetCustomNames,
  extractCustomNames,
  DEFAULT_CHART_TITLES
} from '@/lib/reportConfig'

interface ReportConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: ReportSectionConfig[]) => void
  sections: ReportSectionConfig[]
  year: number
  month: number
}

interface DropdownOptions {
  categories: string[]
  subCategoriesSoftware: string[]
  subCategoriesHardware: string[]
  closeCauses: string[]
}

const MAX_NAME_LENGTH = 100

export default function ReportConfigModal({
  isOpen,
  onClose,
  onSave,
  sections: initialSections,
  year,
  month
}: ReportConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<ReportSectionConfig[]>(initialSections)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Fetch dropdown options when modal opens
  useEffect(() => {
    const fetchOptions = async () => {
      if (!isOpen) return

      setLoadingOptions(true)
      try {
        const res = await fetch(`/api/dashboard/report/options?year=${year}&month=${month}`)
        if (!res.ok) throw new Error('Failed to fetch options')
        const data = await res.json()
        setDropdownOptions(data)
      } catch (error) {
        console.error('Error fetching dropdown options:', error)
        setDropdownOptions(null)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [isOpen, year, month])

  // Load custom names when modal opens
  useEffect(() => {
    if (isOpen) {
      const customNames = loadCustomNames()
      const merged = initialSections.map(section => ({
        ...section,
        customSectionName: customNames[section.id]?.customSectionName,
        customChartName: customNames[section.id]?.customChartName
      }))
      setLocalConfig(merged)
    }
  }, [isOpen, initialSections])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showResetConfirm) {
          setShowResetConfirm(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, showResetConfirm, onClose])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Focus first focusable element when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      if (firstElement) {
        firstElement.focus()
      }
    }
  }, [isOpen])

  const toggleSection = (sectionId: string) => {
    setLocalConfig(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    )
  }

  const updateSectionName = (sectionId: string, value: string) => {
    const trimmed = value.trim()
    setLocalConfig(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, customSectionName: trimmed || undefined } : s
      )
    )
  }

  const updateChartName = (sectionId: string, value: string) => {
    const trimmed = value.trim()
    setLocalConfig(prev =>
      prev.map(s =>
        s.id === sectionId ? { ...s, customChartName: trimmed || undefined } : s
      )
    )
  }

  const canSave = () => {
    return localConfig.some(s => s.enabled)
  }

  const handleSave = () => {
    if (!canSave()) return

    // Save custom names to localStorage
    const customNames = extractCustomNames(localConfig)
    saveCustomNames(customNames)

    // Call parent callback with merged config
    onSave(localConfig)
    onClose()
  }

  const handleResetConfirm = () => {
    setShowResetConfirm(true)
  }

  const handleResetConfirmed = () => {
    resetCustomNames()
    // Clear custom names from local state
    setLocalConfig(prev =>
      prev.map(s => ({
        ...s,
        customSectionName: undefined,
        customChartName: undefined
      }))
    )
    setShowResetConfirm(false)
  }

  const enabledCount = localConfig.filter(s => s.enabled).length
  const enabledSections = localConfig.filter(s => s.enabled)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 id="modal-title" className="text-xl font-semibold text-neutral-900">
              ⚙️ ตั้งค่ารายงานประจำเดือน
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded transition-colors"
              aria-label="ปิด"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Section 1: Visibility */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3 pb-2 border-b">
                1. เลือกส่วนที่จะแสดงในรายงาน
              </h3>
              <div className="space-y-2">
                {localConfig.map((section) => (
                  <label
                    key={section.id}
                    className={`flex items-center gap-3 p-2 rounded hover:bg-neutral-50 cursor-pointer ${
                      enabledCount === 1 && section.enabled ? 'opacity-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => toggleSection(section.id)}
                      disabled={enabledCount === 1 && section.enabled}
                      className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-neutral-900">{section.nameThai}</span>
                    {enabledCount === 1 && section.enabled && (
                      <span className="text-xs text-neutral-500">(ต้องเลือกอย่างน้อย 1 ส่วน)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Section 2: Custom Section Names */}
            {enabledSections.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 pb-2 border-b">
                  2. ชื่อหัวข้อแต่ละส่วน
                </h3>
                <div className="space-y-3">
                  {enabledSections.map((section) => {
                    // Get dropdown options for this section
                    const getSectionOptions = (): string[] => {
                      if (loadingOptions || !dropdownOptions) return []

                      switch (section.id) {
                        case 'section1':
                          return dropdownOptions.categories
                        case 'section2':
                          return dropdownOptions.subCategoriesSoftware
                        case 'section3':
                          return dropdownOptions.subCategoriesHardware
                        case 'section4':
                          return dropdownOptions.closeCauses
                        default:
                          return []
                      }
                    }

                    const sectionOptions = getSectionOptions()

                    return (
                      <div key={`section-name-${section.id}`}>
                        <label className="block text-sm text-neutral-700 mb-1">
                          {section.nameThai}:
                        </label>
                        {loadingOptions ? (
                          <div className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500 text-sm">
                            กำลังโหลด...
                          </div>
                        ) : sectionOptions.length > 0 ? (
                          <select
                            value={section.customSectionName || ''}
                            onChange={(e) => updateSectionName(section.id, e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                          >
                            <option value="">ค่าเริ่มต้น: {section.nameThai}</option>
                            {sectionOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={section.customSectionName || ''}
                            onChange={(e) => updateSectionName(section.id, e.target.value)}
                            placeholder={`ค่าเริ่มต้น: ${section.nameThai}`}
                            maxLength={MAX_NAME_LENGTH}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section 3: Custom Chart Names */}
            {enabledSections.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 pb-2 border-b">
                  3. ชื่อกราฟวงกลมแต่ละกราฟ
                </h3>
                <div className="space-y-3">
                  {enabledSections.map((section) => {
                    const defaultTitle = DEFAULT_CHART_TITLES[section.id] || section.name
                    // Chart titles use categories from database
                    const chartOptions = loadingOptions || !dropdownOptions ? [] : dropdownOptions.categories

                    return (
                      <div key={`chart-name-${section.id}`}>
                        <label className="block text-sm text-neutral-700 mb-1">
                          กราฟ {defaultTitle}:
                        </label>
                        {loadingOptions ? (
                          <div className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500 text-sm">
                            กำลังโหลด...
                          </div>
                        ) : chartOptions.length > 0 ? (
                          <select
                            value={section.customChartName || ''}
                            onChange={(e) => updateChartName(section.id, e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                          >
                            <option value="">ค่าเริ่มต้น: {defaultTitle}</option>
                            {chartOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={section.customChartName || ''}
                            onChange={(e) => updateChartName(section.id, e.target.value)}
                            placeholder={`ค่าเริ่มต้น: ${defaultTitle}`}
                            maxLength={MAX_NAME_LENGTH}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t bg-neutral-50">
            <button
              onClick={handleResetConfirm}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
            >
              คืนค่าเริ่มต้น
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              บันทึก
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
          >
            <h3 id="reset-confirm-title" className="text-lg font-semibold text-neutral-900 mb-2">
              ยืนยันการคืนค่า
            </h3>
            <p className="text-sm text-neutral-600 mb-6">
              คุณต้องการคืนค่าชื่อทั้งหมดเป็นค่าเริ่มต้นหรือไม่?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResetConfirmed}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors text-sm"
              >
                คืนค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
