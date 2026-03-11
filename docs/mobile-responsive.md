# Mobile Responsive Design

> **Last Updated:** 2026-03-10
> **Implementation:** Mobile responsiveness feature for IT Helpdesk Dashboard

## Breakpoints Used

| Breakpoint | Width | Description |
|------------|-------|-------------|
| (default) | < 640px | Mobile phones |
| `sm:` | 640px+ | Small tablets, large phones |
| `md:` | 768px+ | Tablets |
| `lg:` | 1024px+ | Small desktops, laptops |
| `xl:` | 1280px+ | Desktops |

## Component Patterns

### Cards (StatsCards, Summaries)

- **Mobile**: 1 column (`grid-cols-1`)
- **Small**: 2 columns (`sm:grid-cols-2`)
- **Desktop**: 4-5 columns (`lg:grid-cols-4` or `lg:grid-cols-5`)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
```

### Tables (StaffPerformanceTable, OutlierTable, MonthlyTicketList)

- **Mobile**: Card view with stacked info (`md:hidden`)
- **Desktop**: Traditional table with horizontal scroll if needed (`hidden md:block`)

```tsx
{/* Mobile Card View */}
<div className="md:hidden">
  {data.map(item => (
    <div key={item.id} className="p-4 border-b">
      {/* Card content */}
    </div>
  ))}
</div>

{/* Desktop Table View */}
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>
```

### Modals

- **Mobile**: Full width with small padding (`p-2`, `max-w-full`, `max-h-[95vh]`)
- **Desktop**: Max width with centered position (`sm:p-4`, `sm:max-w-6xl`, `sm:max-h-[90vh]`)

```tsx
<div className="fixed inset-0 p-2 sm:p-4">
  <div className="max-w-full sm:max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh]">
    {/* Modal content */}
  </div>
</div>
```

### Charts

- **Mobile**: 250px height
- **Desktop**: 300px height

```tsx
<ResponsiveContainer width="100%" height={250}>
```

### Typography

- **Labels**: `text-xs sm:text-sm`
- **Titles**: `text-base sm:text-lg` or `text-xl sm:text-2xl`
- **Numbers**: `text-2xl sm:text-3xl`

### Padding & Spacing

- **Container padding**: `px-3 sm:px-4`
- **Vertical padding**: `py-4 sm:py-6`
- **Gap**: `gap-2 sm:gap-4` or `gap-4 sm:gap-6`

### Global Search (GlobalSearch)

- **Icon sizes**: `h-4 w-4 sm:h-5 sm:w-5`
- **Input padding**: `pl-9 sm:pl-11 pr-8 sm:pr-10`
- **Input height**: `py-2 sm:py-2.5`
- **Result typography**: `text-xs sm:text-sm` for titles and metadata
- **Modal**: Uses `SearchResultsModal` with full responsive modal styles

**Features:**
- Debounced search (300ms) to reduce API calls
- Dropdown shows top 10 results
- Press Enter to view all results in modal
- Click outside to close dropdown
- Clear button when text is entered

**Search Fields:**
- subject
- assigned_to
- category
- sub_category
- branch_name
- message_id

## Testing

Always test at these widths:
- **375px** - iPhone SE
- **390px** - iPhone 12/13
- **768px** - iPad
- **1024px+** - Desktop

## Responsive Checklist

- [ ] Cards stack vertically on mobile
- [ ] Tables show card view on mobile
- [ ] Modals fit on screen
- [ ] All text is readable
- [ ] Buttons/taps are accessible (min 44px height)
- [ ] Charts are interactive
- [ ] No horizontal scroll on mobile (except in table containers)

## Modified Files

### Components
- `app/components/dashboard/StatsCards.tsx`
- `app/components/dashboard/HeaderFilter.tsx`
- `app/components/dashboard/MonthlyBarChart.tsx`
- `app/components/dashboard/InlineDailyChart.tsx`
- `app/components/dashboard/TopOutliersList.tsx`
- `app/components/dashboard/StaffPerformanceTable.tsx`
- `app/components/dashboard/TicketListModal.tsx`
- `app/components/dashboard/DailyBarChart.tsx`
- `app/components/dashboard/OutlierTable.tsx`
- `app/components/dashboard/MonthlyTicketList.tsx`
- `app/components/dashboard/TicketDetailModal.tsx`
- `app/components/dashboard/GlobalSearch.tsx`
- `app/components/dashboard/SearchResultsModal.tsx`

### Pages
- `app/page.tsx`
- `app/dashboard/outliers/page.tsx`

## Technical Notes

1. **Tailwind CSS responsive utilities** are used exclusively - no custom CSS media queries
2. **Mobile-first approach** - base styles are for mobile, `sm:` and up for larger screens
3. **Touch targets** are at least 44px height on mobile
4. **Truncation** is used for long text (`truncate` class) on mobile
