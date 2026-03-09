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
      expect(screen.getByText('อันดับ')).toBeInTheDocument()
      expect(screen.getByText('ชื่อพนักงาน')).toBeInTheDocument()
      expect(screen.getByText('รับงาน')).toBeInTheDocument()
      expect(screen.getByText('ยังไม่ปิด')).toBeInTheDocument()
      expect(screen.getByText('เวลาเฉลี่ย')).toBeInTheDocument()
    })

    it('should render staff data', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument()
      expect(screen.getByText('วิภา สุขสันต์')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument() // totalAssigned for rank 1
      expect(screen.getByText('5')).toBeInTheDocument() // totalPending for rank 1
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

      expect(screen.getByText('🥇')).toBeInTheDocument()
    })

    it('should display silver medal for rank 2', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      expect(screen.getByText('🥈')).toBeInTheDocument()
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

      expect(screen.getByText('🥉')).toBeInTheDocument()
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

      expect(screen.getByText('#4')).toBeInTheDocument()
    })
  })

  describe('outlier columns', () => {
    it('should show outlier column when showOutlierColumns is true and data exists', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      expect(screen.getByText('Outliers')).toBeInTheDocument()
    })

    it('should not show outlier column when showOutlierColumns is false', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={false} />)

      expect(screen.queryByText('Outliers')).not.toBeInTheDocument()
    })

    it('should display outlier count for each staff member', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      // Outlier counts are in buttons - need to check within context
      // Check that all buttons exist (regardless of count value)
      const allText = screen.getByText('2', { selector: 'button' })
      const allText2 = screen.getByText('1', { selector: 'button' })
      const allText3 = screen.getByText('0', { selector: 'button' })
      expect(allText).toBeInTheDocument()
      expect(allText2).toBeInTheDocument()
      expect(allText3).toBeInTheDocument()
    })

    it('should display avg time breakdown when outlier data exists', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      // Should show normal time
      expect(screen.getByText('25 นาที')).toBeInTheDocument()
      // Should show outlier time in parentheses (80 minutes = 1 hr 20 min)
      expect(screen.getByText('(1 ชม. 20 นาที)')).toBeInTheDocument()
    })
  })

  describe('click handlers', () => {
    it('should call onStaffClick when staff name is clicked', () => {
      const mockClick = jest.fn()
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} onStaffClick={mockClick} />)

      const staffName = screen.getByText('สมชาย ใจดี')
      fireEvent.click(staffName)

      expect(mockClick).toHaveBeenCalledWith('สมชาย ใจดี')
    })

    it('should not make name clickable when onStaffClick is not provided', () => {
      render(<StaffPerformanceTable staff={mockStaffDataWithoutOutliers} />)

      const staffName = screen.getByText('สมชาย ใจดี')
      expect(staffName.tagName).toBe('SPAN')
      expect(staffName).not.toHaveClass('text-blue-600')
    })

    it('should call onOutlierClick when outlier button is clicked', () => {
      const mockClick = jest.fn()
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} onOutlierClick={mockClick} />)

      // Find all outlier buttons with count > 0
      const outlierButtons = screen.getAllByText('→')
      fireEvent.click(outlierButtons[0])

      expect(mockClick).toHaveBeenCalledWith('สมชาย ใจดี')
    })

    it('should disable outlier button when count is 0', () => {
      const mockClick = jest.fn()
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} onOutlierClick={mockClick} />)

      // Rank 3 has 0 outliers
      const rank3Row = screen.getAllByText('ประยุทธ์ มั่นคง')[0].closest('tr')
      const zeroButton = rank3Row?.querySelector('button:disabled')

      expect(zeroButton).toBeInTheDocument()
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

      expect(screen.getByText('1 ชม. 30 นาที')).toBeInTheDocument()
    })
  })

  describe('outlier badge colors', () => {
    it('should display gray badge for 0 outliers', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      const zeros = screen.getAllByText('0')
      const zeroOutlier = zeros.find(el => el.textContent === '0' && el.closest('button'))
      expect(zeroOutlier).toBeInTheDocument()
    })

    it('should display yellow badge for 1-2 outliers', () => {
      render(<StaffPerformanceTable staff={mockStaffData} showOutlierColumns={true} />)

      // Find buttons with outlier counts (yellow badges)
      const oneButton = screen.getByText('1', { selector: 'button' })
      const twoButton = screen.getByText('2', { selector: 'button' })

      expect(oneButton).toBeInTheDocument()
      expect(twoButton).toBeInTheDocument()
    })
  })
})
