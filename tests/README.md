# Test Suite - n8n-auto-ticket-dashboard

This directory contains all test files and configurations for the n8n-auto-ticket-dashboard project.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # E2E tests only
npm run test:security     # Security tests only
npm run test:performance  # Performance tests only
```

## Directory Structure

```
tests/
├── e2e/                    # Playwright E2E tests
│   └── dashboard.spec.ts   # Dashboard E2E tests
├── load/                   # k6 load tests
│   └── k6-load-test.js    # Load test configuration
└── README.md              # This file

__tests__/
├── unit/                  # Unit tests
│   ├── lib/              # Utility function tests
│   ├── components/       # Component tests
│   └── repository/       # Repository tests
├── integration/           # Integration tests
│   └── api/              # API endpoint tests
├── security/             # Security tests
├── performance/          # Performance tests
├── utils/                # Test utilities
├── mocks/                # MSW mock handlers
└── fixtures/             # Test data fixtures
```

## Test Types

### Unit Tests
- **Purpose**: Test individual functions and components in isolation
- **Framework**: Vitest
- **Location**: `__tests__/unit/`
- **Coverage Target**: 80%

### Integration Tests
- **Purpose**: Test API endpoints and database interactions
- **Framework**: Vitest + MSW
- **Location**: `__tests__/integration/`
- **Coverage**: All API endpoints

### E2E Tests
- **Purpose**: Test complete user workflows
- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **Browsers**: Chrome, Firefox, Safari, Mobile

### Security Tests
- **Purpose**: Test for security vulnerabilities
- **Framework**: Vitest
- **Location**: `__tests__/security/`
- **Coverage**: OWASP Top 10

### Performance Tests
- **Purpose**: Test API performance and load handling
- **Framework**: Vitest + k6
- **Location**: `__tests__/performance/` and `tests/load/`
- **Metrics**: p50, p95, p99 response times

## Writing Tests

### Adding a Unit Test

1. Create test file in `__tests__/unit/`
2. Import dependencies
3. Write test cases using `describe` and `it`
4. Run with `npm run test:unit`

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/myFile'

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction()).toBe('expected result')
  })
})
```

### Adding an Integration Test

1. Create test file in `__tests__/integration/api/`
2. Use MSW handlers for mocking
3. Test API contracts
4. Run with `npm run test:integration`

Example:
```typescript
import { describe, it, expect } from 'vitest'

describe('GET /api/dashboard/stats', () => {
  it('should return stats', async () => {
    const response = await fetch('/api/dashboard/stats?year=2026')
    expect(response.status).toBe(200)
  })
})
```

### Adding an E2E Test

1. Create test file in `tests/e2e/`
2. Use Playwright API
3. Test user workflows
4. Run with `npm run test:e2e`

Example:
```typescript
import { test, expect } from '@playwright/test'

test('dashboard loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

## CI/CD Integration

Tests run automatically on GitHub Actions:
- Unit tests: All commits
- Integration tests: All commits
- E2E tests: All commits
- Security tests: All commits
- Performance tests: Master/main only

See `.github/workflows/test.yml` for configuration.

## Coverage Reports

Coverage reports are generated in `coverage/` directory.
View HTML report: `coverage/index.html`

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000
```

### Database Connection Issues
1. Verify SQL Server is running
2. Check `.env.test` credentials
3. Ensure test database exists

### Flaky E2E Tests
1. Run in debug mode: `npm run test:e2e:debug`
2. Check for race conditions
3. Add explicit waits
4. Use data-testid selectors

## Resources

- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Testing Plan](../docs/TESTING_PLAN.md)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [k6 Docs](https://k6.io/docs/)
