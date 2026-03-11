import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import GlobalSearch from '@/app/components/dashboard/GlobalSearch'

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ tickets: [] })
  })
) as jest.Mock

describe('GlobalSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders search input', () => {
    render(<GlobalSearch year={2026} month={null} />)
    expect(screen.getByPlaceholderText(/ค้นหางาน/)).toBeInTheDocument()
  })

  it('debounces search input', async () => {
    const user = userEvent.setup({ delay: null })
    render(<GlobalSearch year={2026} month={null} />)

    const input = screen.getByPlaceholderText(/ค้นหางาน/)
    await user.type(input, 'test')

    // Should not call fetch immediately
    expect(global.fetch).not.toHaveBeenCalled()

    // Should call fetch after debounce
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    }, { timeout: 500 })
  })

  it('shows clear button when text is entered', async () => {
    const user = userEvent.setup()
    render(<GlobalSearch year={2026} month={null} />)

    const input = screen.getByPlaceholderText(/ค้นหางาน/)

    // Initially no clear button
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    // Type to show clear button
    await user.type(input, 'test')

    // Clear button should appear
    const clearButtons = screen.getAllByRole('button')
    expect(clearButtons.length).toBeGreaterThan(0)
  })

  it('clears search on clear button click', async () => {
    const user = userEvent.setup()
    render(<GlobalSearch year={2026} month={null} />)

    const input = screen.getByPlaceholderText(/ค้นหางาน/) as HTMLInputElement
    await user.type(input, 'test')

    expect(input.value).toBe('test')

    // Click clear button (the button with X icon)
    const clearButtons = screen.getAllByRole('button')
    await user.click(clearButtons[0])

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('displays search results when available', async () => {
    const mockTickets = [
      { message_id: '1', subject: 'Test ticket', assigned_to: 'John', status: 'pending', created_date: '2026-03-11' }
    ]

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ tickets: mockTickets })
      })
    ) as jest.Mock

    const user = userEvent.setup({ delay: null })
    render(<GlobalSearch year={2026} month={null} />)

    const input = screen.getByPlaceholderText(/ค้นหางาน/)
    await user.type(input, 'test')

    await waitFor(() => {
      expect(screen.getByText('Test ticket')).toBeInTheDocument()
    }, { timeout: 500 })
  })
})
