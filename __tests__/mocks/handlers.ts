import { http, HttpResponse } from 'msw'

// Base URL for Next.js API routes
const API_BASE = '/api'

export const handlers = [
  // /api/dashboard/stats
  http.get(`${API_BASE}/dashboard/stats`, ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    if (!year) {
      return HttpResponse.json({ error: 'Year is required' }, { status: 400 })
    }

    return HttpResponse.json({
      total: 100,
      closed: 85,
      pending: 15,
      closeRate: 85,
      avgTime: 45,
      avgTimeNormal: 30,
      avgTimeOutlier: 120,
      outlierCount: 5,
      outlierThreshold: 90,
    })
  }),

  // /api/dashboard/monthly
  http.get(`${API_BASE}/dashboard/monthly`, ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year')

    if (!year) {
      return HttpResponse.json({ error: 'Year is required' }, { status: 400 })
    }

    const monthlyData = [
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

    return HttpResponse.json({ monthly: monthlyData })
  }),

  // /api/dashboard/daily
  http.get(`${API_BASE}/dashboard/daily`, ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    if (!year || !month) {
      return HttpResponse.json({ error: 'Year and month are required' }, { status: 400 })
    }

    const dailyData = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      total: Math.floor(Math.random() * 20) + 5,
      closed: Math.floor(Math.random() * 15) + 3,
    }))

    return HttpResponse.json({ daily: dailyData })
  }),

  // /api/dashboard/staff
  http.get(`${API_BASE}/dashboard/staff`, ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    if (!year) {
      return HttpResponse.json({ error: 'Year is required' }, { status: 400 })
    }

    const staffData = [
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

    return HttpResponse.json({
      staff: staffData,
      summary: {
        totalStaff: 3,
        totalAssigned: 135,
        totalClosed: 125,
        totalPending: 10,
      },
    })
  }),

  // /api/dashboard/outliers/top3
  http.get(`${API_BASE}/dashboard/outliers/top3`, ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    if (!year) {
      return HttpResponse.json({ error: 'Year is required' }, { status: 400 })
    }

    const top3Outliers = [
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

    return HttpResponse.json({
      top3: top3Outliers,
      total_count: 5,
    })
  }),

  // /api/dashboard/outliers/all
  http.get(`${API_BASE}/dashboard/outliers/all`, ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    if (!year) {
      return HttpResponse.json({ error: 'Year is required' }, { status: 400 })
    }

    const allOutliers = [
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
      {
        message_id: 'MSG004',
        assigned_to: 'ประยุทธ์ มั่นคง',
        subject: 'อัปเกรด Windows',
        diff_minutes: 88,
        created_date: '2026-03-04T11:00:00',
        assigned_date: '2026-03-04T11:00:00',
        deviation_score: 2.2,
      },
      {
        message_id: 'MSG005',
        assigned_to: 'วิภา สุขสันต์',
        subject: 'ตั้งค่า Email',
        diff_minutes: 85,
        created_date: '2026-03-05T13:00:00',
        assigned_date: '2026-03-05T13:00:00',
        deviation_score: 2.1,
      },
    ]

    return HttpResponse.json({
      outliers: allOutliers,
      summary: {
        total: 5,
        avgDeviation: 2.66,
        maxDeviation: 3.5,
      },
    })
  }),

  // /api/dashboard/tickets
  http.get(`${API_BASE}/dashboard/tickets`, ({ request }) => {
    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')
    const filterType = url.searchParams.get('filterType')
    const staffName = url.searchParams.get('staffName')

    if (!year || !filterType) {
      return HttpResponse.json({ error: 'Year and filterType are required' }, { status: 400 })
    }

    const tickets = [
      {
        message_id: 'MSG001',
        assigned_to: 'สมชาย ใจดี',
        subject: 'ปัญหาเครื่องปริ้นเตอร์ไม่ทำงาน',
        status: 'closed',
        close_time_minute: 150,
        created_date: '2026-03-01T10:00:00',
        assigned_date: '2026-03-01T10:00:00',
      },
      {
        message_id: 'MSG002',
        assigned_to: 'วิภา สุขสันต์',
        subject: 'เน็ตเวิร์กล่าช้า',
        status: 'pending',
        close_time_minute: null,
        created_date: '2026-03-02T14:00:00',
        assigned_date: '2026-03-02T14:00:00',
      },
      {
        message_id: 'MSG003',
        assigned_to: 'ประยุทธ์ มั่นคง',
        subject: 'ติดตั้งโปรแกรมใหม่',
        status: 'closed',
        close_time_minute: 35,
        created_date: '2026-03-03T09:00:00',
        assigned_date: '2026-03-03T09:00:00',
      },
    ]

    return HttpResponse.json({
      tickets,
      total: tickets.length,
    })
  }),

  // /api/dashboard/available-months
  http.get(`${API_BASE}/dashboard/available-months`, () => {
    return HttpResponse.json({
      years: [2024, 2025, 2026],
      months: [
        { value: 0, label: 'ทั้งปี' },
        { value: 1, label: 'ม.ค.' },
        { value: 2, label: 'ก.พ.' },
        { value: 3, label: 'มี.ค.' },
        { value: 4, label: 'เม.ย.' },
        { value: 5, label: 'พ.ค.' },
        { value: 6, label: 'มิ.ย.' },
        { value: 7, label: 'ก.ค.' },
        { value: 8, label: 'ส.ค.' },
        { value: 9, label: 'ก.ย.' },
        { value: 10, label: 'ต.ค.' },
        { value: 11, label: 'พ.ย.' },
        { value: 12, label: 'ธ.ค.' },
      ],
    })
  }),

  // n8n webhook for ticket creation (POST)
  http.post(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.example.com/webhook/test', async ({ request }) => {
    const body = await request.json()

    // Validate required fields
    if (!body.category || !body.branch || !body.subject) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Simulate successful ticket creation
    return HttpResponse.json({
      success: true,
      message_id: `MSG_${Date.now()}`,
      ticket: {
        message_id: `MSG_${Date.now()}`,
        status: 'pending',
        ...body,
      },
    })
  }),
]

export default handlers
