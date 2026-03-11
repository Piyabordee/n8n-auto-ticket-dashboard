import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import DailyBarChart from '@/app/components/dashboard/DailyBarChart'

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ tickets: [] }),
  })
) as jest.Mock

const mockDailyData = [
  { day: '01', total: 10, closed: 8 },
  { day: '02', total: 15, closed: 12 },
  { day: '03', total: 12, closed: 10 },
]

const mockStaffData = [
  {
    rank: 1,
    name: 'สมชาย ใจดี',
    totalAssigned: 50,
    totalClosed: 45,
    totalPending: 5,
    avgTimeAll: 35,
  },
  {
    rank: 2,
    name: 'วิภา สุขสันต์',
    totalAssigned: 45,
    totalClosed: 42,
    totalPending: 3,
    avgTimeAll: 30,
  },
]

describe('DailyBarChart', () => {
  describe('staff table rendering', () => {
    it('should render staff table header with pending column', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByText('อันดับ')).toBeInTheDocument()
      expect(screen.getByText('ชื่อพนักงาน')).toBeInTheDocument()
      expect(screen.getByText('รับงาน')).toBeInTheDocument()
      expect(screen.getByText('ยังไม่ปิด')).toBeInTheDocument()
      expect(screen.getAllByText('ปิดแล้ว').length).toBeGreaterThan(0)
      expect(screen.getByText('เวลาเฉลี่ย')).toBeInTheDocument()
    })

    it('should render staff data with pending counts', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      expect(screen.getByText('วิภา สุขสันต์')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument() // totalAssigned
      expect(screen.getByText('5')).toBeInTheDocument() // totalPending for rank 1
      expect(screen.getByText('3')).toBeInTheDocument() // totalPending for rank 2
    })

    it('should display pending count in red', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      const pendingValues = screen.getAllByText('5')
      const redPending = pendingValues.find(el => el.className.includes('text-red-600'))
      expect(redPending).toBeInTheDocument()
    })
  })

  describe('staff name click handling', () => {
    it('should call onStaffClick when staff name is clicked', () => {
      const mockClick = jest.fn()
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
          onStaffClick={mockClick}
        />
      )

      const staffName = screen.getByText('สมชาย ใจดี')
      fireEvent.click(staffName)

      expect(mockClick).toHaveBeenCalledWith('สมชาย ใจดี')
    })

    it('should not make name clickable when onStaffClick is not provided', () => {
      render(
        <DailyBarChart
          data={mockDailyData}
          monthName="ก.พ."
          year={2026}
          monthIndex={2}
          staffData={mockStaffData}
          onClose={jest.fn()}
        />
      )

      const staffName = screen.getByText('สมชาย ใจดี')
      expect(staffName.tagName).toBe('SPAN')
    })
  })
})
