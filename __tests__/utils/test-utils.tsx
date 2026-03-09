import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/app/components/auth/AuthProvider'

// Mock AuthProvider wrapper for tests
interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return <AuthProvider>{children}</AuthProvider>
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockUser = {
  id: 'admin',
  name: 'Admin User',
  role: 'admin',
}

export const mockStatsData = {
  total: 100,
  closed: 85,
  pending: 15,
  closeRate: 85,
  avgTime: 45,
  avgTimeNormal: 30,
  avgTimeOutlier: 120,
  outlierCount: 5,
  outlierThreshold: 90,
}

export const mockMonthlyData = [
  { month: 1, monthName: 'ม.ค.', total: 120, closed: 100, monthIndex: 0 },
  { month: 2, monthName: 'ก.พ.', total: 110, closed: 95, monthIndex: 1 },
  { month: 3, monthName: 'มี.ค.', total: 130, closed: 110, monthIndex: 2 },
  { month: 4, monthName: 'เม.ย.', total: 115, closed: 98, monthIndex: 3 },
  { month: 5, monthName: 'พ.ค.', total: 125, closed: 105, monthIndex: 4 },
  { month: 6, monthName: 'มิ.ย.', total: 140, closed: 120, monthIndex: 5 },
  { month: 7, monthName: 'ก.ค.', total: 135, closed: 115, monthIndex: 6 },
  { month: 8, monthName: 'ส.ค.', total: 150, closed: 130, monthIndex: 7 },
  { month: 9, monthName: 'ก.ย.', total: 145, closed: 125, monthIndex: 8 },
  { month: 10, monthName: 'ต.ค.', total: 130, closed: 110, monthIndex: 9 },
  { month: 11, monthName: 'พ.ย.', total: 120, closed: 100, monthIndex: 10 },
  { month: 12, monthName: 'ธ.ค.', total: 140, closed: 120, monthIndex: 11 },
]

export const mockStaffData = [
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
    outlierCount: 1,
  },
]

export const mockOutlierData = [
  {
    message_id: 'MSG001',
    assigned_to: 'สมชาย ใจดี',
    subject: 'ปัญหาเครื่องปริ้นเตอร์ไม่ทำงาน',
    diff_minutes: 150,
    created_date: '2026-03-01T10:00:00',
    assigned_date: '2026-03-01T10:00:00',
    deviation_score: 3.5,
  },
  {
    message_id: 'MSG002',
    assigned_to: 'วิภา สุขสันต์',
    subject: 'เน็ตเวิร์กล่าช้า',
    diff_minutes: 120,
    created_date: '2026-03-02T14:00:00',
    assigned_date: '2026-03-02T14:00:00',
    deviation_score: 3.0,
  },
  {
    message_id: 'MSG003',
    assigned_to: 'สมชาย ใจดี',
    subject: 'ติดตั้งโปรแกรมใหม่',
    diff_minutes: 95,
    created_date: '2026-03-03T09:00:00',
    assigned_date: '2026-03-03T09:00:00',
    deviation_score: 2.5,
  },
]

export const mockDailyData = [
  { day: 1, total: 10, closed: 8 },
  { day: 2, total: 12, closed: 10 },
  { day: 3, total: 8, closed: 7 },
  { day: 4, total: 15, closed: 13 },
  { day: 5, total: 11, closed: 9 },
]

// Helper to mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Helper to mock Recharts
export const mockResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="responsive-container">{children}</div>
)

jest.mock('recharts', () => ({
  ResponsiveContainer: mockResponsiveContainer,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
}))
