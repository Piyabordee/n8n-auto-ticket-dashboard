# Testing Guide - n8n-auto-ticket-dashboard

## Overview

This project uses a comprehensive testing strategy with multiple test types:
- Unit Tests (Vitest)
- Integration Tests (Vitest + MSW)
- E2E Tests (Playwright)
- Security Tests (Vitest)
- Performance Tests (Vitest + k6)

## Prerequisites

### Install Dependencies
```bash
npm install
```

### Environment Setup
Create a `.env.test` file:
```env
SQL_SERVER=localhost
SQL_DATABASE=Test_Dev_Born
SQL_USER=sa
SQL_PASSWORD=YourPassword123
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.example.com/webhook/test
```

## Running Tests

### Unit Tests
Test individual components and utilities in isolation.

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run unit tests with coverage
npm run test:coverage
```

**What gets tested:**
- Utility functions (normalizeText, formatTime, reportConfig)
- Repository methods (OutlierRepository)
- Component logic (when isolated)

### Integration Tests
Test API endpoints and database interactions.

```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch
```

**What gets tested:**
- API route handlers
- Database queries
- Request/response validation
- Error handling

### E2E Tests
Test full user flows in a browser.

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed
```

**What gets tested:**
- Complete user workflows
- Page navigation
- Form submissions
- Responsive design
- Accessibility
- Cross-browser compatibility

### Security Tests
Test for security vulnerabilities.

```bash
# Run security tests
npm run test:security
```

**What gets tested:**
- SQL injection
- XSS attacks
- CSRF protection
- Input validation
- Authentication/authorization
- Rate limiting

### Performance Tests
Test API response times and load handling.

```bash
# Run performance tests
npm run test:performance

# Run load tests (requires k6)
npm run test:load
```

**What gets tested:**
- API response times (p50, p95, p99)
- Concurrent request handling
- Memory usage
- Load handling

## Test Structure

```
__tests__/
├── unit/              # Unit tests
│   ├── lib/          # Utility function tests
│   ├── components/   # Component tests
│   └── repository/   # Repository tests
├── integration/       # Integration tests
│   └── api/          # API endpoint tests
├── security/          # Security tests
├── performance/       # Performance tests
├── utils/            # Test utilities
├── mocks/            # MSW handlers
└── fixtures/         # Test data fixtures

tests/
├── e2e/              # Playwright E2E tests
└── load/             # k6 load test scripts
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { normalizeStylizedText } from '@/lib/normalizeText'

describe('normalizeStylizedText', () => {
  it('should normalize stylized text to ASCII', () => {
    const result = normalizeStylizedText('𝓗𝓮𝓵𝓵𝓸')
    expect(result).toBe('Hello')
  })
})
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest'

describe('GET /api/dashboard/stats', () => {
  it('should return KPI stats', async () => {
    const response = await fetch(
      'http://localhost:5000/api/dashboard/stats?year=2026'
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('closed')
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should display dashboard', async ({ page }) => {
  await page.goto('/')
  
  await expect(page.locator('h1')).toContainText('Dashboard')
  await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible()
})
```

## Test Data

### Fixtures
Use test fixtures for consistent test data:

```typescript
import { ticketFixtures } from '__tests__/fixtures/tickets'

const normalTicket = ticketFixtures.normal
const outlierTicket = ticketFixtures.outlier
```

### Database Setup
For integration tests requiring database:

```typescript
import { setupTestDatabase, teardownTestDatabase } from 'test-helpers/dbSetup'

beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})
```

## Coverage

### View Coverage Report
```bash
npm run test:coverage
```

Coverage reports are generated in:
- Terminal output
- `coverage/index.html` (HTML report)
- `coverage/lcov.info` (for CI/CD)

### Coverage Targets
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## CI/CD Integration

Tests run automatically on:
- Every push to master/main/develop
- Every pull request

### GitHub Actions Workflow
1. Unit tests (all commits)
2. Integration tests (all commits)
3. E2E tests (all commits)
4. Security tests (all commits)
5. Performance tests (master/main only)

## Debugging Tests

### Debug Unit Tests
```bash
# Run with verbose output
npm run test:unit -- --reporter=verbose

# Run specific test file
npm run test:unit -- normalizeText.test.ts

# Run tests matching pattern
npm run test:unit -- --grep "normalize"
```

### Debug E2E Tests
```bash
# Run with Playwright Inspector
npm run test:e2e:debug

# Run specific test file
npx playwright test dashboard.spec.ts

# Run with trace
npx playwright test --trace on
```

### Debug Integration Tests
```bash
# Run with verbose output
npm run test:integration -- --reporter=verbose

# Run specific test
npm run test:integration -- stats.test.ts
```

## Best Practices

### Unit Tests
- Test one thing per test
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests fast (<100ms per test)

### Integration Tests
- Test API contracts
- Test error scenarios
- Use test database
- Clean up after tests
- Test database transactions

### E2E Tests
- Test user workflows, not implementation
- Use data-testid attributes
- Wait for elements explicitly
- Test on multiple browsers
- Test mobile responsiveness
- Keep tests stable (avoid flakiness)

### Security Tests
- Test for OWASP Top 10
- Test input validation
- Test authentication/authorization
- Test for injection attacks
- Test for XSS/CSRF

### Performance Tests
- Set realistic targets
- Test under load
- Monitor memory usage
- Test database queries
- Test API response times

## Troubleshooting

### Tests Fail Locally But Pass in CI
- Check environment variables
- Check database connection
- Check Node.js version
- Clear node_modules and reinstall

### Flaky E2E Tests
- Add explicit waits
- Use data-testid selectors
- Avoid hard-coded delays
- Check for race conditions
- Increase timeouts

### Database Connection Errors
- Verify SQL Server is running
- Check connection string
- Verify credentials
- Check firewall settings

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Library](https://testing-library.com/)
