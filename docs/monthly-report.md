# Monthly Report Feature Documentation

## Overview
The Monthly Report feature provides a comprehensive summary of IT Helpdesk tickets with customizable sections and PDF export capability.

## Features

### 1. Section Selection
- Users can select which sections to include in the report
- Available sections:
  - **Section 1**: Overall Ticket Summary (ภาพรวม Ticket ทั้งหมด)
  - **Section 2**: Software Deep Dive (เจาะลึกหมวด Software)
  - **Section 3**: Software Problem Grouping (การจัดกลุ่มปัญหา Software)
  - **Section 4**: POS/RATE Error Causes (สาเหตุของ POS/RATE Error)

- Selection is persisted in localStorage
- At least one section must be enabled

### 2. PDF Export
- Exports selected sections to a multi-page PDF
- Includes pie charts and tables
- Shows progress during export (0% -> 100%)
- Filename format: `monthly-report-{month}-{year}-{date}.pdf`
- Uses jsPDF and html2canvas for high-quality PDF generation

### 3. Visual Design
- Blue primary buttons (bg-primary-600) for proper visibility
- Responsive design for mobile and desktop
- Accessible with keyboard navigation and ARIA labels

## Usage

### Opening the Report
1. Navigate to the Dashboard
2. Click the "รายงานประจำเดือน" button
3. Select the desired year and month

### Customizing Sections
1. Click the "เลือกส่วน" button in the modal header
2. Check/uncheck sections to include/exclude
3. Click "ยืนยัน" to apply changes

### Exporting to PDF
1. Customize sections as desired
2. Click the "Export PDF" button
3. Wait for the export to complete (progress indicator shown)
4. PDF will be automatically downloaded

## Technical Details

### Components
- `MonthlyReportModal.tsx`: Main modal component
- `SectionSelectorDropdown.tsx`: Dropdown for section selection
- `reportDataMapping.ts`: Maps database tickets to fixed categories

### Utilities
- `reportSections.ts`: Section configuration and localStorage management
- `pdfExport.ts`: PDF generation using jsPDF and html2canvas

### Data Flow
1. User opens modal → API fetches tickets for selected month
2. `reportDataMapping.ts` categorizes tickets into fixed sections
3. Component renders sections based on user selection
4. PDF export captures rendered sections and creates PDF

## API Endpoints

- `GET /api/dashboard/report?year={year}&month={month}` - Fetches report data for selected period

## Dependencies

- **jsPDF**: PDF generation library
- **html2canvas**: Converts HTML elements to canvas for PDF rendering
- **Recharts**: Chart library for pie charts
