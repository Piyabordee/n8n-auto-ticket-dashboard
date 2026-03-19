import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/components/auth/AuthProvider'

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authProvider?: boolean
  authUser?: any
}

export function renderWithProviders(
  ui: ReactElement,
  {
    authProvider = true,
    authUser = null,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    if (authProvider) {
      return <AuthProvider initialUser={authUser}>{children}</AuthProvider>
    }
    return <>{children}</>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithProviders as render }

// Mock data generators
export const mockTicket = {
  message_id: 'test-message-1',
  assigned_to: 'Test User',
  subject: 'Test Subject',
  status: 'closed',
  created_date: '2026-03-19T10:00:00Z',
  assigned_date: '2026-03-19T10:05:00Z',
  close_time_minute: 120,
  is_outlier: 0,
  category: 'Software',
  sub_category: 'Installation',
  branch: 'Main Branch',
  close_cause: 'User Error',
  close_reason: 'Reinstalled software',
}

export const mockOutlierTicket = {
  message_id: 'outlier-message-1',
  assigned_to: 'Test User',
  subject: 'Outlier Subject',
  status: 'closed',
  created_date: '2026-03-19T10:00:00Z',
  assigned_date: '2026-03-19T10:05:00Z',
  close_time_minute: 5000,
  is_outlier: 1,
  category: 'Hardware',
  sub_category: 'Monitor',
  branch: 'Main Branch',
  diff_minutes: 5000,
  deviation_score: 10.5,
}

export const mockStaffPerformance = {
  rank: 1,
  name: 'Test User',
  totalAssigned: 100,
  totalClosed: 95,
  totalPending: 5,
  avgTimeAll: 120,
  avgTimeNormal: 80,
  avgTimeOutlier: 200,
  outlierCount: 5,
  personalMedian: 100,
  personalMAD: 10,
  personalThreshold: 250,
}

export const mockKPIStats = {
  total: 1000,
  closed: 950,
  pending: 50,
  closeRate: 95,
  avgTime: 120,
  outlierCount: 25,
  outlierThreshold: 250,
}

export const mockMonthlyData = [
  {
    month: 1,
    monthName: 'January',
    total: 100,
    closed: 95,
    monthIndex: 0,
  },
  {
    month: 2,
    monthName: 'February',
    total: 120,
    closed: 115,
    monthIndex: 1,
  },
  {
    month: 3,
    monthName: 'March',
    total: 150,
    closed: 140,
    monthIndex: 2,
  },
]

export const mockDailyData = [
  { day: 1, total: 10, closed: 9 },
  { day: 2, total: 12, closed: 11 },
  { day: 3, total: 15, closed: 14 },
]

export const mockReportData = {
  section1: {
    chartData: [
      { name: 'Software', value: 50, color: 'hsl(210, 70%, 50%)' },
      { name: 'Hardware', value: 30, color: 'hsl(280, 70%, 50%)' },
      { name: 'Network', value: 20, color: 'hsl(340, 70%, 50%)' },
    ],
    tableData: [
      {
        category: 'Software',
        total: 50,
        closed: 48,
        pending: 2,
        avgTime: 100,
      },
      {
        category: 'Hardware',
        total: 30,
        closed: 28,
        pending: 2,
        avgTime: 150,
      },
      {
        category: 'Network',
        total: 20,
        closed: 19,
        pending: 1,
        avgTime: 120,
      },
    ],
  },
  section2: {
    chartData: [
      { name: 'Installation', value: 20, color: 'hsl(210, 70%, 50%)' },
      { name: 'License', value: 15, color: 'hsl(280, 70%, 50%)' },
    ],
    tableData: [],
  },
  section3: {
    chartData: [
      { name: 'Monitor', value: 10, color: 'hsl(210, 70%, 50%)' },
      { name: 'Keyboard', value: 8, color: 'hsl(280, 70%, 50%)' },
    ],
    tableData: [],
  },
  section4: {
    chartData: [
      { name: 'User Error', value: 30, color: 'hsl(210, 70%, 50%)' },
      { name: 'System Bug', value: 10, color: 'hsl(280, 70%, 50%)' },
    ],
    tableData: [],
  },
}

// Wait for async operations
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key])
    },
  }
}

// Mock date
export const mockDate = (date: string) => {
  vi.spyOn(Date, 'now').mockReturnValue(new Date(date).getTime())
}
