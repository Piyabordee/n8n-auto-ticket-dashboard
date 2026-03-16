import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import StaffPerformanceTable from '@/app/components/dashboard/StaffPerformanceTable'

const mockStaffData = [
  {
    rank: 1,
    name: 'สมชาย ใจดี',
    totalAssigned: 50,
    totalClosed: 45,
    totalPending: 5,
    avgTimeAll: 35,
    avgTimeNormal: 25,
    avgTimeOutlier: 80,
    outlierCount: 2,
  },
  {
    rank: 2,
    name: 'วิภา สุขสันต์',
    totalAssigned: 45,
    totalClosed: 42,
    totalPending: 3,
    avgTimeAll: 30,
    avgTimeNormal: 22,
    avgTimeOutlier: 75,
    outlierCount: 1,
  },
  {
    rank: 3,
    name: 'ประยุทธ์ มั่นคง',
    totalAssigned: 40,
    totalClosed: 38,
    totalPending: 2,
    avgTimeAll: 28,
    avgTimeNormal: 20,
    avgTimeOutlier: 70,
    outlierCount: 0,
  },
]

const mockStaffDataWithoutOutliers = [
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

describe('StaffPerformanceTable', () => {
  describe('basic rendering', () => {
    it('should render table header', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      expect(screen.getByText('ผลงานทีม (Staff Performance)')).toBeInTheDocument()
      expect(screen.getAllByText('อันดับ').length).toBeGreaterThan(0)
      expect(screen.getAllByText('ชื่อพนักงาน').length).toBeGreaterThan(0)
      expect(screen.getAllByText('รับงาน').length).toBeGreaterThan(0)
      expect(screen.getAllByText('ยังไม่ปิด').length).toBeGreaterThan(0)
      expect(screen.getAllByText('เวลาเฉลี่ย').length).toBeGreaterThan(0)
    })

    it('should render staff data', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      expect(screen.getAllByText('สมชาย ใจดี').length).toBeGreaterThan(0)
      expect(screen.getAllByText('วิภา สุขสันต์').length).toBeGreaterThan(0)
      expect(screen.getAllByText('50').length).toBeGreaterThan(0) // totalAssigned for rank 1
      expect(screen.getAllByText('5').length).toBeGreaterThan(0) // totalPending for rank 1
    })

    it('should render empty table when staff is undefined', () => {
      render(<StaffPerformanceTable />)

      expect(screen.getByText('ผลงานทีม (Staff Performance)')).toBeInTheDocument()
    })

    it('should render empty table when staff is empty array', () => {
      render(<StaffPerformanceTable staff={[]} />)

      expect(screen.getByText('ผลงานทีม (Staff Performance)')).toBeInTheDocument()
    })
  })

  describe('rank badges', () => {
    it('should display gold medal for rank 1', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    })

    it('should display silver medal for rank 2', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    })

    it('should display bronze medal for rank 3', () => {
      // Add a third staff member for this test
      const staffWithRank3 = [
        ...mockStaffDataWithoutOutliers,
        {
          rank: 3,
          name: 'ประยุทธ์ มั่นคง',
          totalAssigned: 40,
          totalClosed: 38,
          totalPending: 2,
          avgTimeAll: 28,
        },
      ]

      render(<StaffPerformanceTable staff={staffWithRank3} />)

      expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    })

    it('should display number for ranks beyond 3', () => {
      const staffWithHigherRank = [
        ...mockStaffDataWithoutOutliers,
        {
          rank: 4,
          name: 'ทดสอบ ระบบ',
          totalAssigned: 30,
          totalClosed: 28,
          totalPending: 2,
          avgTimeAll: 25,
        },
      ]

      render(<StaffPerformanceTable staff={staffWithHigherRank} />)

      expect(screen.getAllByText('4').length).toBeGreaterThan(0)
    })
  })

  describe('outlier columns', () => {
    it('should show outlier column when showOutlierColumns is true and data exists', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      expect(screen.getAllByText('Outliers').length).toBeGreaterThan(0)
    })

    it('should not show outlier column when showOutlierColumns is false', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={false} />)

      expect(screen.queryByText('Outliers')).not.toBeInTheDocument()
    })

    it('should display outlier count for each staff member', () => {
      const { container } = render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      const outlierButtons = container.querySelectorAll('button.badge')
      expect(outlierButtons.length).toBe(3) // 3 staff members
      expect(outlierButtons[0].textContent?.includes('2')).toBe(true)
      expect(outlierButtons[1].textContent?.includes('1')).toBe(true)
      expect(outlierButtons[2].textContent?.includes('0')).toBe(true)
    })

    it('should display avg time breakdown when outlier data exists', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      // Should show normal time
      expect(screen.getAllByText('25 นาที').length).toBeGreaterThan(0)
      // Should show outlier time in parentheses (80 minutes = 1 hr 20 min)
      expect(screen.getAllByText('(1 ชม. 20 นาที)').length).toBeGreaterThan(0)
    })
  })

  describe('click handlers', () => {
    it('should call onStaffClick when staff name is clicked', () => {
      const mockClick = jest.fn()
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} onStaffClick={mockClick} />)

      // Find all elements with the staff name (mobile and desktop views)
      const staffNames = screen.getAllByText('สมชาย ใจดี')
      // Click on the first one (could be button in mobile or desktop view)
      fireEvent.click(staffNames[0])

      expect(mockClick).toHaveBeenCalledWith('สมชาย ใจดี')
    })

    it('should not make name clickable when onStaffClick is not provided', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      // Find all elements with the staff name (mobile and desktop views)
      const staffNames = screen.getAllByText('สมชาย ใจดี')
      // At least one should be a span (not clickable)
      const hasSpanName = staffNames.some(el => el.tagName === 'SPAN')
      expect(hasSpanName).toBe(true)
    })

    it('should call onOutlierClick when outlier button is clicked', () => {
      const mockClick = jest.fn()
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} onOutlierClick={mockClick} />)

      const outlierButton = screen.getByTitle('ดู Outliers ของ สมชาย ใจดี')
      fireEvent.click(outlierButton)

      expect(mockClick).toHaveBeenCalledWith('สมชาย ใจดี')
    })

    it('should disable outlier button when count is 0', () => {
      const mockClick = jest.fn()
      const { container } = render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} onOutlierClick={mockClick} />)

      // Rank 3 has 0 outliers - find the outlier button with '0' text
      const outlierButtons = container.querySelectorAll('button.badge')
      const zeroButton = Array.from(outlierButtons).find(b => b.textContent?.includes('0'))

      // Check that the button is disabled
      expect(zeroButton).toBeDisabled()
    })
  })

  describe('stat number click handling', () => {
    const mockStaffWithAllData = [
      {
        rank: 1,
        name: 'สมชาย ใจดี',
        totalAssigned: 50,
        totalClosed: 45,
        totalPending: 5,
        avgTimeAll: 35,
        outlierCount: 2,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
      },
    ]

    it('should call onStatClick with correct filter type when assigned number is clicked', () => {
      const mockStatClick = jest.fn()
      const { container } = render(
        <StaffPerformanceTable
          staff={mockStaffWithAllData}
          showOutlierColumns={true}
          onStatClick={mockStatClick}
        />
      )

      const assignedButton = container.querySelector('button[title*="ดูงานทั้งหมดของ สมชาย ใจดี"]')
      fireEvent.click(assignedButton!)

      expect(mockStatClick).toHaveBeenCalledWith('สมชาย ใจดี', 'all')
    })

    it('should call onStatClick with pending filter type when pending number is clicked', () => {
      const mockStatClick = jest.fn()
      const { container } = render(
        <StaffPerformanceTable
          staff={mockStaffWithAllData}
          showOutlierColumns={true}
          onStatClick={mockStatClick}
        />
      )

      const pendingButton = container.querySelector('button[title*="ดูงานที่ยังไม่ปิดของ สมชาย ใจดี"]')
      fireEvent.click(pendingButton!)

      expect(mockStatClick).toHaveBeenCalledWith('สมชาย ใจดี', 'pending')
    })

    it('should not make numbers clickable when onStatClick is not provided', () => {
      const { container } = render(
        <StaffPerformanceTable
          staff={mockStaffWithAllData}
          showOutlierColumns={true}
        />
      )

      const assignedSpans = container.querySelectorAll('span.text-neutral-900')
      const hasClickableAssigned = Array.from(assignedSpans).some(el => el.textContent === '50')
      expect(hasClickableAssigned).toBe(true)
    })
  })

  describe('time formatting', () => {
    it('should format minutes correctly', () => {
      const staffWithMinutes = [
        {
          rank: 1,
          name: 'ทดสอบ',
          totalAssigned: 10,
          totalClosed: 10,
          totalPending: 0,
          avgTimeAll: 45,
        },
      ]

      render(<StaffPerformanceTable staff={staffWithMinutes} />)

      expect(screen.getByText('45.0')).toBeInTheDocument()
    })

    it('should format hours and minutes correctly', () => {
      const staffWithHours = [
        {
          rank: 1,
          name: 'ทดสอบ',
          totalAssigned: 10,
          totalClosed: 10,
          totalPending: 0,
          avgTimeAll: 125,
          avgTimeNormal: 90,
          avgTimeOutlier: 150,
          outlierCount: 1,
        },
      ]

      render(<StaffPerformanceTable staff={staffWithHours} showOutlierColumns={true} />)

      // Use getAllByText as the formatted time may appear in multiple places now
      expect(screen.getAllByText('1 ชม. 30 นาที').length).toBeGreaterThan(0)
    })
  })

  describe('outlier badge colors', () => {
    it('should display gray badge for 0 outliers', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      const zeroOutlierButton = screen.getByTitle('ไม่มี Outliers')
      expect(zeroOutlierButton).toBeInTheDocument()
    })

    it('should display yellow badge for 1-2 outliers', () => {
      const { container } = render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      const outlierButtons = container.querySelectorAll('button.badge')

      // Find buttons containing text '1' and '2' within outlier buttons
      const buttonsArray = Array.from(outlierButtons)
      const oneButton = buttonsArray.find(b => b.textContent?.includes('1'))
      const twoButton = buttonsArray.find(b => b.textContent?.includes('2'))

      expect(oneButton).toBeDefined()
      expect(twoButton).toBeDefined()
      expect(oneButton?.className).toContain('bg-warning-100')
      expect(twoButton?.className).toContain('bg-warning-100')
    })
  })
})
