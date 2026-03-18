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
      report/
        PageHeader.tsx               # NEW - Extracted from print page
        PieChartSection.tsx          # NEW - Extracted from print page
  lib/
    reportConfig.ts                  # NEW - Config management utilities
    reportSections.ts                # MODIFY - Add custom name fields to interface
  report/
    print/
      page.tsx                       # MODIFY - Use custom settings, extract components
```

### Prerequisite: Component Extraction

Before implementing the customization feature, extract inline components from `app/report/print/page.tsx`:

1. **Extract `PageHeader`** (lines 222-229) → `app/components/dashboard/report/PageHeader.tsx`
   - Props: `title: string`, `subtitle: string`, `customTitle?: string`

2. **Extract `PieChartSection`** (lines 231-309) → `app/components/dashboard/report/PieChartSection.tsx`
   - Props: `title: string`, `data: ReportSectionItem[]`, `total: number`, `customTitle?: string`

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
```

### Default Chart Title Mappings

```typescript
const DEFAULT_CHART_TITLES: Record<string, string> = {
  section1: 'Category',
  section2: 'Software',
  section3: 'Sub Services',
  section4: 'Causes'
}
```

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `monthly-report-sections` | `Record<string, { enabled: boolean }>` | Section visibility (existing) |
| `monthly-report-section-names` | `Record<string, { customSectionName?, customChartName? }>` | Custom names (NEW) |

### Display Priority

For section headers:
1. If `customSectionName` exists and not empty → use it
2. Otherwise → use default `nameThai`

For pie charts:
1. If `customChartName` exists and not empty → use it
2. Otherwise → use `DEFAULT_CHART_TITLES[sectionId]`

### Section Visibility Logic

Sections display with **AND logic**:
- Show section if `enabled === true` **AND** `totalTickets > 0`
- This means:
  - User-disabled sections never show (even with data)
  - Sections with no data never show (even if enabled)
  - User cannot force-show empty sections

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
const [localConfig, setLocalConfig] = useState<ReportSectionConfig[]>(sections)
const [showResetConfirm, setShowResetConfirm] = useState(false)
```

**Key Functions:**
- `toggleSection(id: string)` - Toggle section enabled state
- `updateSectionName(id: string, name: string)` - Update customSectionName in localConfig
- `updateChartName(id: string, name: string)` - Update customChartName in localConfig
- `handleSave()` - Save to localStorage and call onSave with merged config
- `handleResetConfirm()` - Show reset confirmation dialog
- `handleResetConfirmed()` - Clear all custom names and save
- `canSave()` - Check if at least 1 section is enabled

**Reset Confirmation UI:**
- Custom confirmation dialog (NOT browser confirm)
- Thai language: "คุณต้องการคืนค่าชื่อทั้งหมดเป็นค่าเริ่มต้นหรือไม่?"
- Buttons: "ยกเลิก" (cancel), "คืนค่า" (confirm)

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

### Existing Files to Modify

1. **`app/report/print/page.tsx`**
   - Add state for custom names
   - Load custom names on mount
   - Add "⚙️ ตั้งค่ารายงาน" button
   - Pass custom names to `PageHeader` and `PieChartSection`
   - Conditionally render sections based on `enabled` flag AND data availability
   - Import extracted components

2. **`app/lib/reportSections.ts`**
   - Add `customSectionName?: string` to `ReportSectionConfig`
   - Add `customChartName?: string` to `ReportSectionConfig`
   - Update load/save functions to handle custom names

3. **`app/components/dashboard/SectionSelectorDropdown.tsx`**
   - Note: This component is NOT replaced by the new modal
   - The dropdown is used in other contexts; ReportConfigModal is report-specific

### New Components to Create

1. **`app/components/dashboard/report/PageHeader.tsx`** (extracted)
   - Props: `title: string`, `subtitle: string`, `customTitle?: string`
   - Uses `customTitle` for subtitle if provided

2. **`app/components/dashboard/report/PieChartSection.tsx`** (extracted)
   - Props: `title: string`, `data: ReportSectionItem[]`, `total: number`, `customTitle?: string`
   - Uses `customTitle` for chart title if provided

3. **`app/components/dashboard/ReportConfigModal.tsx`**
   - Main configuration modal with 3 sections

4. **`app/lib/reportConfig.ts`**
   - Utility functions for managing custom names

### Migration Strategy

Existing users may have `monthly-report-sections` in localStorage. The implementation must:

1. **Read existing data gracefully**:
   - Try to read `monthly-report-sections` (old format)
   - If missing, use all sections enabled (default)
   - If corrupted, clear and use defaults

2. **Write new format**:
   - `monthly-report-sections` continues to store `{ enabled: boolean }`
   - `monthly-report-section-names` stores new custom names

3. **No data migration needed**:
   - Old keys remain unchanged
   - New keys are additive only
   - Users without custom names see default behavior

---

## Error Handling

### Edge Cases

| Scenario | Handling |
|----------|----------|
| User tries to uncheck last section | Disable checkbox, show tooltip "ต้องเลือกอย่างน้อย 1 ส่วน" |
| Custom name is empty string | Treat as "no custom name", use default, don't save empty string to localStorage |
| Section enabled but has no data | Section doesn't show (AND logic: enabled AND has data) |
| Section disabled but has data | Section doesn't show (user preference overrides data) |
| localStorage corrupted | Log error, use defaults, clear corrupted data |
| localStorage quota exceeded | Show error message to user, don't save changes |
| Reset confirmation | Show custom confirmation dialog (Thai: "คุณต้องการคืนค่าชื่อทั้งหมดเป็นค่าเริ่มต้นหรือไม่?") |

### Validation

- At least 1 section must be enabled before save
- Empty string names are treated as "no custom name" (not saved)
- Trim whitespace from input values before saving
- Maximum length for custom names: 100 characters (prevent abuse)

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
