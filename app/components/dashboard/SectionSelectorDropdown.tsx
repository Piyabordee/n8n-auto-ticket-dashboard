'use client'

import { useState, useRef, useEffect } from 'react'
import type { ReportSectionConfig } from '@/lib/reportSections'

interface SectionSelectorDropdownProps {
  sections: ReportSectionConfig[]
  onSectionsChange: (sections: ReportSectionConfig[]) => void
}

export default function SectionSelectorDropdown({
  sections,
  onSectionsChange
}: SectionSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSection = (sectionId: string) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, enabled: !s.enabled } : s
    )
    onSectionsChange(updated)
  }

  const enabledCount = sections.filter(s => s.enabled).length
  const totalCount = sections.length

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="เลือกส่วนของรายงาน"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="hidden sm:inline">
          เลือกส่วน ({enabledCount}/{totalCount})
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-elevated border border-neutral-200 py-2 z-50"
          role="listbox"
          aria-label="เลือกส่วนของรายงาน"
        >
          <div className="px-3 py-2 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-900">
              เลือกส่วนที่ต้องการแสดง
            </p>
            <p className="text-xs text-neutral-500">
              เลือกอย่างน้อย 1 ส่วน
            </p>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {sections.map((section) => (
              <label
                key={section.id}
                className="flex items-start gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={() => toggleSection(section.id)}
                  disabled={enabledCount === 1 && section.enabled}
                  className="mt-0.5 w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {section.nameThai}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {section.name}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-neutral-100">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
