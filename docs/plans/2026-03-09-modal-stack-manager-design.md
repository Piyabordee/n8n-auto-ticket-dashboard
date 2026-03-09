# Modal Stack Manager Design Document

> **Date:** 2026-03-09
> **Author:** Claude + User
> **Status:** Approved

---

## Problem Statement

The `DailyBarChart` modal displays daily ticket data but lacks the ability to click on individual day bars to view tickets for that specific day. The `InlineDailyChart` component already has this functionality (opens `TicketListModal`), but it's not available in `DailyBarChart`.

**User Requirement:**
- Click on a day bar in `DailyBarChart` → Open `TicketListModal` showing tickets for that day
- When closing `TicketListModal` → Return to `DailyBarChart` (keep it open)
- Support modal stacking (multiple modals open at once)

---

## Architecture

### Modal Manager Pattern

Create a global context-based modal manager that:
- Maintains a stack of open modals
- Provides methods to open/close modals
- Handles z-index layering automatically
- Is reusable for any future modal needs

```
Modal Stack (Array)
┌─────────────────────────────────────┐
│ Modal #3: z-index 70                │
├─────────────────────────────────────┤
│ Modal #2: z-index 60                │
├─────────────────────────────────────┤
│ Modal #1: z-index 50                │
└─────────────────────────────────────┘
```

---

## Components

### 1. Modal Types

```typescript
// types/modal.ts

export type ModalComponent<T = any> = React.ComponentType<T>

export interface ModalInstance {
  id: string
  component: ModalComponent
  props: any
  zIndex: number
}

export interface ModalContextType {
  modals: ModalInstance[]
  openModal: <T>(component: ModalComponent<T>, props: T) => void
  closeModal: () => void
  closeAll: () => void
}
```

### 2. ModalProvider

**File:** `app/components/modals/ModalProvider.tsx`

- Wraps the app (placed in `layout.tsx`)
- Manages modal stack state
- Renders active modals with proper z-index
- Provides `useModal` hook

### 3. useModal Hook

```typescript
const { openModal, closeModal, closeAll } = useModal()

// Open a modal
openModal(TicketListModal, {
  isOpen: true,
  year: 2026,
  month: 3,
  day: '18',
  filterType: 'all',
  title: 'งานทั้งหมด',
  onClose: closeModal
})

// Close top modal
closeModal()

// Close all modals
closeAll()
```

### 4. Updated Components

**DailyBarChart** (`app/components/dashboard/DailyBarChart.tsx`)
- Add `onDayClick?: (day: string) => void` prop
- Add `onClick` handlers to Bar components
- Call `useModal().openModal()` when day clicked

**TicketListModal** (`app/components/dashboard/TicketListModal.tsx`)
- Already has `onClose` prop
- No changes needed (will receive `closeModal` as `onClose`)

---

## Data Flow

```
┌─────────────────┐
│ User clicks day │
│   bar in chart  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ DailyBarChart.onDayClick()  │
│   uses useModal() hook      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ openModal(TicketListModal, props)   │
│ - Generate unique ID                 │
│ - Calculate z-index (base + depth)   │
│ - Push to modals array               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ ModalProvider renders modals         │
│ - Each modal gets wrapper div        │
│ - z-index applied to wrapper         │
│ - Top modal has highest z-index      │
└─────────────────────────────────────┘

         (User views modal content)

         ▼
┌─────────────────┐
│ User closes     │
│   modal (X btn) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ TicketListModal.onClose()           │
│   calls closeModal()                │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ closeModal()                        │
│ - Pop last modal from array         │
│ - Re-render with remaining modals   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Previous modal (DailyBarChart)      │
│   visible again                     │
└─────────────────────────────────────┘
```

---

## Z-Index Strategy

| Stack Depth | Z-Index | Usage |
|-------------|---------|-------|
| 0 (base) | 50 | First modal (e.g., DailyBarChart) |
| 1 | 60 | Second modal (e.g., TicketListModal) |
| 2 | 70 | Third modal |
| 3+ | 80+ | Additional modals |

**Constants:**
```typescript
const Z_INDEX_BASE = 50
const Z_INDEX_STEP = 10
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `types/modal.ts` | Modal types |
| `app/components/modals/ModalProvider.tsx` | Modal context and provider |
| `app/components/modals/ModalRenderer.tsx` | Renders modal stack |
| `app/components/dashboard/DailyBarChart.tsx` | Add click handler |
| `app/layout.tsx` | Wrap with ModalProvider |
| `app/page.tsx` | Pass onDayClick to DailyBarChart |

---

## Edge Cases

### 1. No Modals Open
- `closeModal()` does nothing
- `closeAll()` does nothing

### 2. Rapid Open/Close
- React state updates handle batching
- Each modal gets unique ID (timestamp + random)

### 3. Modal Prop Changes
- Modal props are captured at open time
- Changes after open don't affect already-open modals

### 4. Escape Key
- Pressing Escape closes top modal only
- Supports standard modal UX

---

## Testing Strategy

1. **Unit Tests**
   - `ModalProvider` state management
   - `useModal` hook behavior

2. **Integration Tests**
   - Click day in `DailyBarChart` → `TicketListModal` opens
   - Close `TicketListModal` → `DailyBarChart` remains
   - Multiple modal stacking

3. **Manual Tests**
   - Click day with tickets
   - Click day with no tickets
   - Open multiple modals, close in sequence
   - Press Escape key

---

## Future Extensions

This design supports:
- Toast notifications (could use same system)
- Confirmation dialogs
- Form modals
- Image preview modals
- Any modal-type UI element

---

## References

- Recharts Bar onClick: https://recharts.org/en-US/api/Bar
- Context API: https://react.dev/reference/react/useContext
- Portal pattern (if needed for escape hatch)
