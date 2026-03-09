import React from 'react'
import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import StatsCards from '@/app/components/dashboard/StatsCards'

describe('StatsCards', () => {
  const defaultProps = {
    total: 100,
    closed: 85,
    pending: 15,
    closeRate: 85,
    avgTime: 45,
  }

  describe('basic rendering', () => {
    it('should render all default stats cards', () => {
      render(<StatsCards {...defaultProps} />)

      expect(screen.getByText('จำนวนงานทั้งหมด')).toBeInTheDocument()
      expect(screen.getByText('ยังไม่ปิด')).toBeInTheDocument()
      expect(screen.getByText('อัตราการปิดงาน')).toBeInTheDocument()
      expect(screen.getByText('เวลาเฉลี่ย')).toBeInTheDocument()
    })

    it('should display correct values', () => {
      render(<StatsCards {...defaultProps} />)

      expect(screen.getByText('100')).toBeInTheDocument() // total
      expect(screen.getByText('15')).toBeInTheDocument() // pending
      expect(screen.getByText('85%')).toBeInTheDocument() // closeRate
      expect(screen.getByText('45 นาที')).toBeInTheDocument() // avgTime
    })

    it('should render 4 columns when outlier data is not provided', () => {
      const { container } = render(<StatsCards {...defaultProps} />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-4')
    })
  })

  describe('outlier data display', () => {
    it('should render 5 columns when outlier data is provided', () => {
      const propsWithOutliers = {
        ...defaultProps,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
        outlierCount: 5,
      }

      const { container } = render(<StatsCards {...propsWithOutliers} />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-5')
      expect(screen.getByText('Outliers')).toBeInTheDocument()
    })

    it('should display outlier breakdown in avg time card', () => {
      const propsWithOutliers = {
        ...defaultProps,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
        outlierCount: 5,
      }

      render(<StatsCards {...propsWithOutliers} />)

      expect(screen.getByText('เวลาเฉลี่ย (ปกติ / Outlier)')).toBeInTheDocument()
      expect(screen.getByText('30 นาที')).toBeInTheDocument() // normal
      expect(screen.getByText('2 ชม.')).toBeInTheDocument() // outlier (120 min = 2 hours)
    })

    it('should display outlier count with correct color', () => {
      const propsWithOutliers = {
        ...defaultProps,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
        outlierCount: 5,
      }

      render(<StatsCards {...propsWithOutliers} />)

      const outlierCount = screen.getByText('5')
      expect(outlierCount).toBeInTheDocument()
    })
  })

  describe('clickable cards', () => {
    it('should show click indicator when onCardClick is provided', () => {
      const mockClick = jest.fn()
      render(<StatsCards {...defaultProps} onCardClick={mockClick} />)

      // Check for click indicators (👆 emoji)
      const indicators = screen.getAllByText('👆')
      expect(indicators).toHaveLength(2) // Total and Pending cards
    })

    it('should call onCardClick with correct filter when total card is clicked', () => {
      const mockClick = jest.fn()
      render(<StatsCards {...defaultProps} onCardClick={mockClick} />)

      // Find the total card container and click it
      const totalCard = screen.getByText('จำนวนงานทั้งหมด').closest('div')
      fireEvent.click(totalCard!)

      expect(mockClick).toHaveBeenCalledWith('all')
    })

    it('should call onCardClick with correct filter when pending card is clicked', () => {
      const mockClick = jest.fn()
      render(<StatsCards {...defaultProps} onCardClick={mockClick} />)

      const pendingCard = screen.getByText('ยังไม่ปิด').closest('div')
      fireEvent.click(pendingCard!)

      expect(mockClick).toHaveBeenCalledWith('pending')
    })

    it('should not show click indicator when onCardClick is not provided', () => {
      render(<StatsCards {...defaultProps} />)

      expect(screen.queryByText('👆')).not.toBeInTheDocument()
    })
  })

  describe('time formatting', () => {
    it('should format minutes correctly', () => {
      render(<StatsCards {...defaultProps} avgTime={45} />)

      expect(screen.getByText('45 นาที')).toBeInTheDocument()
    })

    it('should format hours and minutes correctly', () => {
      render(<StatsCards {...defaultProps} avgTime={125} />)

      expect(screen.getByText('2 ชม. 5 นาที')).toBeInTheDocument()
    })

    it('should format hours only correctly', () => {
      render(<StatsCards {...defaultProps} avgTime={120} />)

      expect(screen.getByText('2 ชม.')).toBeInTheDocument()
    })

    it('should format days, hours and minutes correctly', () => {
      render(<StatsCards {...defaultProps} avgTime={1525} />)

      expect(screen.getByText('1 วัน 1 ชม. 25 นาที')).toBeInTheDocument()
    })

    it('should format days only correctly', () => {
      render(<StatsCards {...defaultProps} avgTime={2880} />)

      expect(screen.getByText('2 วัน')).toBeInTheDocument()
    })

    it('should show dash for zero time', () => {
      render(<StatsCards {...defaultProps} avgTime={0} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('outlier border colors', () => {
    it('should display gray border when outlier count is 0', () => {
      const props = {
        ...defaultProps,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
        outlierCount: 0,
      }

      render(<StatsCards {...props} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should display yellow border when outlier count is 3', () => {
      const props = {
        ...defaultProps,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
        outlierCount: 3,
      }

      render(<StatsCards {...props} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display orange border when outlier count is 5', () => {
      const props = {
        ...defaultProps,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
        outlierCount: 5,
      }

      render(<StatsCards {...props} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display red border when outlier count is 8', () => {
      const props = {
        ...defaultProps,
        avgTimeNormal: 30,
        avgTimeOutlier: 120,
        outlierCount: 8,
      }

      render(<StatsCards {...props} />)
      expect(screen.getByText('8')).toBeInTheDocument()
    })
  })
})
