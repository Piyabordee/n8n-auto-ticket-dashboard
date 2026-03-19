import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      gracefulStop: '5s',
    },
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '1m', target: 150 },
        { duration: '1m', target: 200 },
      ],
      gracefulStop: '5s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
}

const BASE_URL = 'http://localhost:5000/api'

export default function () {
  const statsRes = http.get(`${BASE_URL}/dashboard/stats?year=2026`, {
    tags: { name: 'DashboardStats' },
  })
  check(statsRes, {
    'stats status is 200': (r) => r.status === 200,
    'stats has data': (r) => JSON.parse(r.body).total > 0,
  }) || errorRate.add(1)
  responseTime.add(statsRes.timings.duration)

  sleep(1)

  const monthlyRes = http.get(`${BASE_URL}/dashboard/monthly?year=2026`, {
    tags: { name: 'MonthlyData' },
  })
  check(monthlyRes, {
    'monthly status is 200': (r) => r.status === 200,
  }) || errorRate.add(1)

  sleep(1)

  const staffRes = http.get(`${BASE_URL}/dashboard/staff?year=2026`, {
    tags: { name: 'StaffPerformance' },
  })
  check(staffRes, {
    'staff status is 200': (r) => r.status === 200,
  }) || errorRate.add(1)

  sleep(2)
}
