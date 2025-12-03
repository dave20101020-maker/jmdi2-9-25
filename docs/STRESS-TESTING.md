# Stress Testing Guide

Comprehensive guide to load testing Project's AI endpoints using k6.

## Table of Contents

- [Quick Start](#quick-start)
- [Understanding k6](#understanding-k6)
- [AI Endpoint Tests](#ai-endpoint-tests)
- [Test Scenarios](#test-scenarios)
- [Interpreting Results](#interpreting-results)
- [Performance Tuning](#performance-tuning)
- [Advanced Testing](#advanced-testing)

---

## Quick Start

### Installation

```bash
# macOS
brew install k6

# Linux (Ubuntu/Debian)
sudo apt-get install k6

# Windows
choco install k6

# or download from https://k6.io/docs/get-started/install
```

### Run Your First Test

```bash
cd backend

# Basic AI endpoint test
k6 run tests/load/ai-endpoints.js

# Spike test
k6 run tests/load/spike-test.js

# Soak test (sustained load)
k6 run tests/load/soak-test.js
```

### Expected Output

```
     ✓ insights status is 200
     ✓ insights response time < 5s
     ✗ coach status is 200
   
   data_received..................: 1.2 MB  12 kB/s
   data_sent.......................: 456 kB  4.5 kB/s
   http_req_duration...............: avg=2.5s  p(90)=4.2s  p(99)=6.1s
   http_req_failed.................: 2.5%
   http_reqs.......................: 1200    12 reqs/s

FAILED - 2.5% of requests failed
```

---

## Understanding k6

### Key Concepts

**Virtual Users (VUs)**
```
10 VUs = 10 simultaneous users
Each VU runs the test script independently
```

**Stages**
```
Gradual load increase/decrease
Similar to: warm-up → peak load → cool-down
```

**Checks**
```
Assertions that pass/fail (don't stop test if fail)
Example: check response status is 200
```

**Thresholds**
```
Pass/fail criteria for the entire test
Example: 95% of requests < 5s
If threshold fails, test fails
```

### Metrics

k6 tracks several metrics automatically:

| Metric | Type | Description |
|--------|------|-------------|
| `http_req_duration` | Trend | Response time |
| `http_req_failed` | Rate | % of failed requests |
| `http_reqs` | Counter | Total requests |
| `data_received` | Counter | Total bytes received |
| `data_sent` | Counter | Total bytes sent |
| `iterations` | Counter | Full test iterations |

---

## AI Endpoint Tests

### Main Test: ai-endpoints.js

Load test for key AI endpoints with ramp-up pattern.

**Load Profile:**
```
Time    VUs    Phase
0s      0      Start
30s     5      Ramp up to 5
1m30s   10     Ramp to 10
2m30s   20     Ramp to 20 (peak)
3m30s   10     Ramp down to 10
4m      0      Cool down
```

**Endpoints Tested:**
- `POST /api/ai/insights` - Get personalized insights
- `POST /api/ai/coach/message` - AI coach messages
- `POST /api/ai/meditation` - Generate meditation
- `POST /api/ai/goals/smart` - SMART goal generation
- `POST /api/ai/journal/prompt` - Journal prompts

**Run:**

```bash
k6 run tests/load/ai-endpoints.js
```

**Success Criteria:**
- ✅ Error rate < 10%
- ✅ 95% response time < 5 seconds
- ✅ No timeout errors

### Spike Test: spike-test.js

Tests how system handles sudden traffic surge.

**Load Profile:**
```
Time    VUs    Phase
0s      0      Start
10s     10     Warm up
15s     100    SPIKE (10x increase)
25s     100    Hold spike
30s     10     Ramp down
40s     0      Cool down
```

**Run:**

```bash
k6 run tests/load/spike-test.js
```

**Detects:**
- Cascading failures
- Queue buildup
- Memory leaks
- Timeout handling

### Soak Test: soak-test.js

Long-running test for stability over time.

**Load Profile:**
```
Time     VUs   Phase
0m       0     Start
2m       50    Warm up
12m      50    Sustained load
14m      0     Cool down
```

**Run:**

```bash
k6 run tests/load/soak-test.js
```

**Detects:**
- Memory leaks
- Connection pool exhaustion
- Performance degradation
- Resource exhaustion

---

## Test Scenarios

### Scenario 1: Standard Load Test

```bash
# 50 concurrent users for 5 minutes
k6 run -u 50 -d 5m tests/load/ai-endpoints.js

# Custom options override file config
k6 run tests/load/ai-endpoints.js --stages "0s:0,30s:10,1m:10,30s:0"
```

### Scenario 2: Ramp Test

Gradually increase load to find breaking point.

```bash
k6 run -u 100 -d 10m tests/load/ai-endpoints.js
```

Monitor metrics:
- When does error rate increase?
- When does p95 response time exceed threshold?
- Where's the breaking point?

### Scenario 3: Stress Test

Push system beyond normal limits.

```bash
k6 run -u 500 -d 2m tests/load/ai-endpoints.js
```

### Scenario 4: Endurance Test

Run for extended period (1+ hour).

```bash
k6 run -u 20 -d 1h tests/load/ai-endpoints.js
```

### Custom Scenario

Create your own test file:

```javascript
// custom-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up
    { duration: '3m', target: 20 },   // Stay at 20
    { duration: '1m', target: 0 },    // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],  // 95% < 2s
    'http_req_failed': ['rate<0.05'],     // < 5% failures
  },
};

export default function () {
  const res = http.get('http://localhost:5000/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

```bash
k6 run custom-test.js
```

---

## Interpreting Results

### Summary Output

```
     ✓ status is 200
     ✗ response time < 2s
   
   checks.........................: 95.2% ✓ 2853 ✗ 140
   data_received..................: 1.2 MB  12 kB/s
   data_sent.......................: 456 kB  4.5 kB/s
   http_req_blocked................: avg=5ms    p(90)=10ms    max=100ms
   http_req_connecting.............: avg=2ms    p(90)=5ms     max=50ms
   http_req_duration...............: avg=1.8s   p(90)=3.2s    p(99)=4.5s
   ├─ { static:yes }...............: avg=500ms p(90)=1s     p(99)=1.5s
   ├─ { static:no }................: avg=2.5s  p(90)=4.2s    p(99)=5.1s
   http_req_failed.................: 5.2%
   http_req_receiving..............: avg=50ms   p(90)=100ms   max=500ms
   http_req_sending................: avg=10ms   p(90)=20ms    max=100ms
   http_req_tls_handshaking........: avg=0ms    p(90)=0ms     max=0ms
   http_req_waiting................: avg=1.7s   p(90)=3.1s    p(99)=4.4s
   http_reqs.......................: 960      10 reqs/s
   iteration_duration..............: avg=6.2s   p(90)=8.1s    p(99)=10s
   iterations.......................: 160      1.6 iters/s
```

### Key Metrics Explained

**Checks**: Assertion pass/fail rate
- `✓` = Passed
- `✗` = Failed
- 95.2% = Most checks passed

**http_req_duration**: Response time distribution
- `avg` = Average response time
- `p(90)` = 90th percentile (90% of requests faster)
- `p(99)` = 99th percentile (99% faster)
- `max` = Worst response time

**http_req_failed**: Percentage of failed requests
- Should be < 5-10%
- Check error log for details

**http_reqs**: Throughput
- 10 reqs/s = System handled 10 requests/second
- Scale with VUs

**iteration_duration**: Time for one full test script
- Includes think-time (sleep)
- `sleep(5)` adds 5 seconds

### Common Issues

**High error rate:**
```
http_req_failed: 45.2%

Causes:
- Backend overload
- API timeout
- Database connection pool exhausted
- Memory limit reached

Solution:
- Reduce concurrent users
- Check server logs
- Increase database connections
- Scale horizontally
```

**Slow response times:**
```
http_req_duration: avg=8.5s (too slow)

Causes:
- Database queries slow
- External API calls slow
- Network latency
- CPU bottleneck

Solution:
- Add database indexes
- Cache responses
- Use CDN
- Optimize queries
```

**Timeout errors:**
```
dial_error: connection reset by peer

Causes:
- Connection limits hit
- Server shutdown
- Network issues
- Client timeout too short

Solution:
- Increase connection pool
- Check server capacity
- Increase timeout settings
```

---

## Performance Tuning

### Backend Optimization

**Database:**
```javascript
// Add indexes for AI endpoints
db.habits.createIndex({ userId: 1, createdAt: -1 });
db.entries.createIndex({ userId: 1, date: -1 });
```

**Caching:**
```javascript
// Cache frequently accessed data
const redis = new Redis();
const insights = await redis.get(`insights:${userId}`);
if (!insights) {
  insights = await generateInsights(userId);
  redis.setex(`insights:${userId}`, 3600, insights);
}
```

**Connection Pooling:**
```javascript
// Backend pool configuration
const pool = {
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

**API Response:**
```javascript
// Stream large responses
res.setHeader('Content-Type', 'application/json');
res.write('{"data":[');
for (let item of items) {
  res.write(JSON.stringify(item) + ',');
}
res.write(']}');
res.end();
```

### Test Optimization

**Reduce Think Time:**
```javascript
// Faster iterations
sleep(0.5);  // Instead of sleep(5)
```

**Reuse Tokens:**
```javascript
// Get once in setup, reuse in all iterations
export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
  };
}
```

**Batch Requests:**
```javascript
// Test batch endpoint instead of individual requests
const batch = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
];
http.post('/api/batch', JSON.stringify(batch));
```

---

## Advanced Testing

### Custom Metrics

```javascript
import { Counter, Gauge, Trend, Rate } from 'k6/metrics';

const myCounter = new Counter('my_counter');
const myGauge = new Gauge('my_gauge');
const myTrend = new Trend('my_trend');
const myRate = new Rate('my_rate');

export default function () {
  myCounter.add(1);
  myGauge.set(100);
  myTrend.add(response.timings.duration);
  check(response, {
    'ok': (r) => r.status === 200,
  }) || myRate.add(1);
}
```

### Thresholds with Tags

```javascript
export const options = {
  thresholds: {
    // Overall thresholds
    'http_req_duration': ['p(95)<5000'],
    // Tag-specific thresholds
    'http_req_duration{endpoint:insights}': ['p(95)<3000'],
    'http_req_duration{endpoint:coach}': ['p(95)<6000'],
  },
};

export default function () {
  // Tag requests
  http.get('/api/insights', {
    tags: { endpoint: 'insights' },
  });
}
```

### Cloud Testing (k6 Cloud)

```bash
# Sync to cloud
k6 cloud tests/load/ai-endpoints.js

# Run on k6 infrastructure (distributed)
# View results in cloud dashboard
```

### Real-time Monitoring

```bash
# Export to JSON
k6 run tests/load/ai-endpoints.js --out json=results.json

# Process results
jq '.data.samples | group_by(.metric) | map({
  metric: .[0].metric,
  min: min_by(.value).value,
  max: max_by(.value).value,
  avg: (map(.value) | add / length)
})' results.json
```

---

## Best Practices

1. **Start small** - Begin with low VUs, gradually increase
2. **Baseline first** - Test current performance before optimization
3. **Realistic scenarios** - Mimic actual user behavior
4. **Monitor backend** - Watch logs, CPU, memory during tests
5. **Isolate tests** - Don't run tests against production
6. **Multiple runs** - Results vary, run tests multiple times
7. **Document findings** - Record baseline and improvements
8. **Automate tests** - Include in CI/CD pipeline
9. **Alert on regressions** - Fail if performance degrades
10. **Communicate results** - Share findings with team

---

## Resources

- [k6 Official Documentation](https://k6.io/docs/)
- [k6 Scripting Examples](https://github.com/grafana/k6/tree/master/examples)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Load Testing Checklist](https://k6.io/docs/testing-guides/load-testing-checklist/)
