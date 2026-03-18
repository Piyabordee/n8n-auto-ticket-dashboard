# Monthly Report Customization Design

**Date:** 2026-03-18
**Author:** Claude (Brainstorming Session)
**Status:** Draft

---

## Overview

Allow users to customize the monthly report by:
1. Selecting which sections to display
2. Customizing section header names
3. Customizing pie chart titles separately from section names

Configuration is managed through a modal accessible from the monthly report page, with settings persisted in localStorage.

---

## Requirements

### Functional Requirements
- FR1: User can select which report sections to display (minimum 1 section)
- FR2: User can customize the name of each section header
- FR3: User can customize the title of each pie chart independently
- FR4: Settings persist across browser sessions via localStorage
- FR5: User can reset all custom names to defaults with confirmation

### Non-Functional Requirements
- NFR1: Configuration changes apply immediately (no page reload needed for preview)
- NFR2: Graceful fallback to defaults if localStorage is corrupted
- NFR3: Modal UI works on mobile devices
- NFR4: Thai language support for all UI elements

---

## Architecture

### Components

```
app/
  components/
    dashboard/
      ReportConfigModal.tsx          # NEW - Main configuration modal
  lib/
    reportConfig.ts                  # NEW - Config management utilities
  report/
    print/
      page.tsx                       # MODIFY - Use custom settings
```

### Data Flow

```
User clicks "⚙️ ตั้งค่ารายงาน"
    ↓
ReportConfigModal opens
    ↓
Load current settings from localStorage
    ↓
User modifies:
  - Section visibility (checkboxes)
  - Section names (input fields)
  - Chart names (input fields)
    ↓
User clicks "บันทึก"
    ↓
Save to localStorage
    ↓
Close modal, report updates with new settings
```

---

## Data Structure

### Type Definitions

```typescript
interface ReportSectionConfig {
  id: string                    // 'section1', 'section2', 'section3', 'section4'
  name: string                  // Default English name
  nameThai: string              // Default Thai name
  description: string
  enabled: boolean              // Show/hide section
  order: number

  // NEW: Custom names (optional)
  customSectionName?: string    // Custom header name
  customChartName?: string      // Custom pie chart title
}

interface ReportNamesConfig {
  [sectionId: string]: {
    sectionName?: string
    chartName?: string
  }
}
```

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `monthly-report-sections` | `Record<string, { enabled: boolean }>` | Section visibility (existing) |
| `monthly-report-section-names` | `ReportNamesConfig` | Custom names (NEW) |

### Display Priority

For section headers:
1. If `customSectionName` exists → use it
2. Otherwise → use default `nameThai`

For pie charts:
1. If `customChartName` exists → use it
2. Otherwise → use default chart title

---

## UI Design

### Modal Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ ตั้งค่ารายงานประจำเดือน                              [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  1. เลือกส่วนที่จะแสดงในรายงาน                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│    ☑ ภาพรวม Ticket ทั้งหมด                                  │
│    ☑ เจาะลึกหมวด Software                                    │
│    ☐ การจัดกลุ่มปัญหา Software                              │
│    ☑ สาเหตุของ POS/RATE Error                                 │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  2. ชื่อหัวข้อแต่ละส่วน                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│    ภาพรวม Ticket ทั้งหมด:                                    │
│    [ภาพรวมปัญหาทั้งหมด________________________]             │
│                                                                 │
│    เจาะลึกหมวด Software:                                      │
│    [ปัญหาด้าน Software_______________________]                 │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  3. ชื่อกราฟวงกลมแต่ละกราฟ                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│    กราฟ Category:     [กราฟแสดงประเภทปัญหา____________]   │
│    กราฟ Software:     [กราฟแยกตาม Software__________]      │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│           [คืนค่าเริ่มต้น]      [ยกเลิก]    [บันทึก]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Modal Trigger

Button placement on `/report/print/page.tsx`:
- Position: Next to "พิมพ์ / Save as PDF" button
- Label: "⚙️ ตั้งค่ารายงาน"
- Style: Secondary button (neutral/gray)

### Section Visibility Rules

- Minimum 1 section must be enabled
- Last enabled checkbox is disabled (cannot uncheck)
- Section 2 and 3 only show inputs for enabled sections

---

## Component Specifications

### ReportConfigModal

**Props:**
```typescript
interface ReportConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: ReportSectionConfig[]) => void
  sections: ReportSectionConfig[]
}
```

**State:**
```typescript
const [localSections, setLocalSections] = useState<ReportSectionConfig[]>(sections)
const [localNames, setLocalNames] = useState<ReportNamesConfig>({})
const [showResetConfirm, setShowResetConfirm] = useState(false)
```

**Key Functions:**
- `toggleSection(id: string)` - Toggle section enabled state
- `updateSectionName(id: string, name: string)` - Update custom section name
- `updateChartName(id: string, name: string)` - Update custom chart name
- `handleSave()` - Save to localStorage and call onSave
- `handleReset()` - Clear all custom names (with confirmation)
- `canSave()` - Check if at least 1 section is enabled

### reportConfig.ts (New Library)

**Functions:**
```typescript
// Load custom names from localStorage
function loadCustomNames(): ReportNamesConfig

// Save custom names to localStorage
function saveCustomNames(names: ReportNamesConfig): void

// Reset custom names to defaults
function resetCustomNames(): void

// Get display name for section
function getSectionDisplayName(config: ReportSectionConfig): string

// Get display name for chart
function getChartDisplayName(config: ReportSectionConfig, defaultTitle: string): string
```

---

## Integration Points

### Existing Components to Modify

1. **`/report/print/page.tsx`**
   - Add state for custom names
   - Load custom names on mount
   - Add "⚙️ ตั้งค่ารายงาน" button
   - Pass custom names to `PageHeader` and `PieChartSection`
   - Conditionally render sections based on `enabled` flag

2. **`PageHeader` component**
   - Add `customTitle?: string` prop
   - Use custom title if provided, otherwise use default

3. **`PieChartSection` component**
   - Add `customTitle?: string` prop
   - Use custom title if provided, otherwise use default

### Existing Files to Reference

- `app/lib/reportSections.ts` - Section definitions and utilities
- `app/components/dashboard/SectionSelectorDropdown.tsx` - Reference for section selection UI

---

## Error Handling

### Edge Cases

| Scenario | Handling |
|----------|----------|
| User tries to uncheck last section | Disable checkbox, show tooltip "ต้องเลือกอย่างน้อย 1 ส่วน" |
| Custom name is empty string | Fall back to default name, don't save empty string |
| localStorage corrupted | Log error, use defaults, clear corrupted data |
| localStorage quota exceeded | Show error message, don't save |
| Reset confirmation | Show confirm dialog before clearing names |

### Validation

- At least 1 section must be enabled before save
- Empty string names are treated as "no custom name"
- Trim whitespace from input values

---

## Testing Strategy

### Unit Tests
- Test `loadCustomNames()` with valid/invalid/missing data
- Test `saveCustomNames()` with various inputs
- Test `getSectionDisplayName()` priority logic
- Test `getChartDisplayName()` priority logic

### Integration Tests
- Test modal open/close with correct initial state
- Test save flow updates localStorage and report
- Test reset flow clears custom names
- Test section visibility affects report rendering

### E2E Tests
- User opens config modal
- User changes section visibility
- User sets custom names
- User saves and sees changes in report
- User resets and sees default names restored

---

## Accessibility

- ARIA labels for all inputs
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management when modal opens/closes
- Screen reader announcements for save/reset actions
- Minimum touch target size (44x44px) for mobile

---

## Future Enhancements

- Save configurations per user (if auth is added)
- Export/import configuration as JSON
- Template system (save multiple named configurations)
- Reorder sections via drag-and-drop

---

## Approval

- [x] Brainstorming complete
- [ ] Spec review passed
- [ ] User approved
- [ ] Implementation plan created
