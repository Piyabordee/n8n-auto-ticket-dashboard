import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import OutlierExplanationModal from '@/app/components/dashboard/OutlierExplanationModal'

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      staff: [
        {
          rank: 1,
          name: 'Test Staff',
          totalAssigned: 10,
          totalClosed: 8,
          totalPending: 2,
          avgTimeAll: 120,
          avgTimeNormal: 60,
          avgTimeOutlier: 300,
          outlierCount: 2,
          personalMedian: 90,
          personalMAD: 8,
          personalThreshold: 210
        }
      ]
    })
  })
) as jest.Mock

describe('OutlierExplanationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <OutlierExplanationModal isOpen={false} onClose={() => {}} year={2026} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render modal when isOpen is true', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/คำอธิบายวิธีคำนวณ Outlier/)).toBeInTheDocument()
  })

  it('should render ELI5 section', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/Outlier คืออะไร/)).toBeInTheDocument()
    expect(screen.getByText(/งานที่ใช้เวลานานผิดปกติ/)).toBeInTheDocument()
  })

  it('should render Technical section', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/วิธีคำนวน/)).toBeInTheDocument()
    expect(screen.getByText(/Median/)).toBeInTheDocument()
    expect(screen.getByText(/MAD/)).toBeInTheDocument()
  })

  it('should render staff data table', async () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    await waitFor(() => {
      expect(screen.getByText(/Test Staff/)).toBeInTheDocument()
      expect(screen.getByText('3 ชม. 30 นาที')).toBeInTheDocument() // 210 min threshold
    })
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(
      <OutlierExplanationModal isOpen={true} onClose={onClose} year={2026} />
    )

    const closeButton = screen.getByLabelText('Close')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should show loading state', () => {
    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    expect(screen.getByText(/กำลังโหลด/)).toBeInTheDocument()
  })

  it('should show error state when API fails', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      })
    )

    render(
      <OutlierExplanationModal isOpen={true} onClose={() => {}} year={2026} />
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument()
    })
  })
})
