# Testing Guide

Complete guide to running tests in Project, including unit tests, integration tests, and stress tests.

## Table of Contents

- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Stress Testing](#stress-testing)
- [Continuous Integration](#continuous-integration)
- [Test Coverage](#test-coverage)
- [Troubleshooting](#troubleshooting)

---

## Frontend Testing

### Running Frontend Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open test UI
npm run test:ui
```

### Test Structure

Frontend tests are located in `src/tests/` and follow the pattern:

```
src/tests/
├── setup.js              # Test configuration and mocks
├── prompts.spec.js       # AI prompts module tests
└── components.spec.js    # Component tests
```

### Writing Frontend Tests

Use Vitest + React Testing Library:

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders with text', () => {
    render(<MyComponent>Hello</MyComponent>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Testing Practices

✅ **Do:**
- Test user interactions, not implementation details
- Use `getByRole`, `getByLabelText` over `getByTestId`
- Test accessibility alongside functionality
- Keep tests focused and descriptive
- Mock external dependencies (API calls, timers)

❌ **Don't:**
- Test React internals or component state directly
- Use `getByClass` or `getBySelector` for component queries
- Make actual API calls in unit tests
- Create overly complex test setups

### Common Test Utilities

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Render component
render(<Component />);

// Query elements
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');
screen.getByPlaceholderText('Enter name');
screen.getByText(/success/i);

// User interactions
await userEvent.type(input, 'text');
await userEvent.click(button);
await userEvent.keyboard('{Enter}');

// Wait for async operations
await waitFor(() => {
  expect(element).toBeInTheDocument();
});

// Fire events directly
fireEvent.change(input, { target: { value: 'test' } });
```

---

## Backend Testing

### Running Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- habit.test.js

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# AI-specific tests
npm run test:ai

# Integration tests
npm run test:integration
```

### Test Structure

Backend tests use Jest:

```
backend/tests/
├── unit/              # Unit tests for individual functions
├── integration/       # Integration tests with database
├── load/             # Load/stress tests with k6
└── fixtures/         # Test data and mocks
```

### Example Backend Test

```javascript
describe('Habit Controller', () => {
  it('should create a habit', async () => {
    const habitData = {
      title: 'Morning Exercise',
      frequency: 'daily',
      pillar: 'fitness'
    };

    const response = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${token}`)
      .send(habitData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### Mocking in Backend Tests

```javascript
import { vi } from 'vitest';

// Mock external services
vi.mock('@/services/aiService', () => ({
  generateInsight: vi.fn().mockResolvedValue({ insight: 'test' })
}));

// Mock database
const mockHabit = { id: '123', title: 'Exercise' };
Habit.findById = vi.fn().mockResolvedValue(mockHabit);
```

---

## Stress Testing

### Running Stress Tests

```bash
cd backend

# Run main AI endpoint stress test
k6 run tests/load/ai-endpoints.js

# With custom settings (5 virtual users for 1 minute)
k6 run -u 5 -d 1m tests/load/ai-endpoints.js

# Spike test (sudden load increase)
k6 run tests/load/spike-test.js

# Soak test (sustained load)
k6 run tests/load/soak-test.js

# Output to JSON
k6 run tests/load/ai-endpoints.js --out json=results.json

# With cloud reporting
k6 run tests/load/ai-endpoints.js --cloud
```

### Test Scenarios

**AI Endpoints Test** (`ai-endpoints.js`)
- Tests: /api/ai/insights, /api/ai/coach, /api/ai/meditation
- Ramps from 5 to 20 concurrent users
- Duration: ~5 minutes
- Success threshold: 95% requests < 5s response time

**Spike Test** (`spike-test.js`)
- Sudden spike from 10 to 100 users
- Simulates traffic surge
- Duration: ~30 seconds

**Soak Test** (`soak-test.js`)
- Sustained load of 50 users
- Long-running test (14+ minutes)
- Detects memory leaks and degradation

### Interpreting Results

```
k6 run test.js

Summary:
  data_received..................: 1.2 MB 12 kB/s
  data_sent.......................: 456 kB  4.5 kB/s
  http_req_blocked................: avg=120ms    p(90)=500ms   max=1.2s
  http_req_connecting.............: avg=50ms     p(90)=200ms   max=650ms
  http_req_duration...............: avg=2.5s     p(90)=4.2s    max=8.1s
  http_req_failed.................: 2.5%
  http_req_receiving..............: avg=50ms     p(90)=100ms   max=500ms
  http_req_sending................: avg=20ms     p(90)=40ms    max=200ms
  http_req_tls_handshaking........: avg=0s       p(90)=0s      max=0s
  http_req_waiting................: avg=2.4s     p(90)=4.1s    max=8.0s
  http_reqs.......................: 1200      12 reqs/s
```

**Key Metrics:**
- `http_req_duration`: Response time
- `http_req_failed`: Failure rate (should be < 5%)
- `http_reqs`: Throughput
- Error rate: Logged in custom metrics

### Setting Performance Thresholds

In k6 tests:

```javascript
export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<5000'],  // 95% < 5s
    'http_req_failed': ['rate<0.1'],      // < 10% failure
    'errors': ['rate<0.05'],              // < 5% custom errors
  },
};
```

---

## Continuous Integration

### GitHub Actions Workflows

Three automated workflows run on every push/PR:

**1. Frontend Tests** (`.github/workflows/frontend-tests.yml`)
- Runs on: Every push to main/develop, PRs
- Tests: Linting, unit tests, build
- Duration: ~5 minutes
- Artifacts: Build output, coverage reports

**2. Backend Tests** (`.github/workflows/backend-tests.yml`)
- Runs on: Every push to main/develop, PRs
- Tests: Unit, integration, AI, security audit
- Services: MongoDB container
- Duration: ~8 minutes
- Artifacts: Coverage reports

**3. Deployment** (`.github/workflows/deploy.yml`)
- Runs on: Merge to main, or manual trigger
- Stages: Build, test, deploy to staging/production
- Auto-rollback on failure
- Slack notifications

### Checking CI Status

```bash
# View workflow status in GitHub
# Settings > Actions > All workflows

# Check specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>

# Cancel a run
gh run cancel <run-id>
```

---

## Test Coverage

### Coverage Goals

Project aims for:
- **Frontend**: 60% line coverage
- **Backend**: 70% line coverage
- **Critical paths**: 90%+ coverage

### Generating Coverage Reports

```bash
# Frontend
npm run test:coverage

# Backend
cd backend && npm test -- --coverage

# View HTML report
open coverage/index.html
```

### Coverage Badges

In README.md:

```markdown
[![Frontend Coverage](https://img.shields.io/codecov/c/github/dave20101020-maker/Project-BETA?label=frontend&flag=frontend)](https://codecov.io/gh/dave20101020-maker/Project-BETA)
[![Backend Coverage](https://img.shields.io/codecov/c/github/dave20101020-maker/Project-BETA?label=backend&flag=backend)](https://codecov.io/gh/dave20101020-maker/Project-BETA)
```

---

## Troubleshooting

### Frontend Tests

**"Cannot find module @/..."**
```bash
# Check alias configuration in vite.config.js
# Reinstall dependencies
rm -rf node_modules && npm install
```

**Tests timeout**
```javascript
// Increase timeout for slow operations
it('long operation', async () => {
  // ...
}, { timeout: 10000 });
```

**Memory issues**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm test
```

### Backend Tests

**MongoDB connection failed**
```bash
# Ensure MongoDB is running
mongod --version

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db npm test
```

**Tests hanging**
```javascript
// Add test timeout
jest.setTimeout(10000);

// Close connections after all tests
afterAll(async () => {
  await mongoose.disconnect();
});
```

### Stress Tests

**k6 not found**
```bash
# Install k6
brew install k6  # macOS
# or
sudo apt-get install k6  # Linux
```

**API authentication fails**
```bash
# Ensure test user exists and credentials are correct
# Update test credentials in test file
```

**Connection refused**
```bash
# Ensure backend is running
npm run server

# Or start with Docker
docker-compose up -d
```

---

## Best Practices

1. **Test behavior, not implementation** - Focus on what users see, not how it works
2. **Keep tests fast** - Mock external services, use in-memory databases
3. **Organize logically** - Group related tests, use descriptive names
4. **Maintain test data** - Use factories, fixtures, and consistent test data
5. **Monitor coverage** - Aim for 60-70% line coverage, 90% on critical paths
6. **CI/CD first** - Always run tests locally before pushing
7. **Document assumptions** - Comment complex test setups
8. **Isolate tests** - No shared state between tests
9. **Use snapshots sparingly** - Only for stable UI components
10. **Performance matters** - Keep test suite fast for quick feedback

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [k6 Documentation](https://k6.io/docs/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
