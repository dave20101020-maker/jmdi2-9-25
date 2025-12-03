// k6 load test examples and common scenarios

export const basicLoadTestExample = `
// Basic ramp-up test: gradually increase load
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '1m30s', target: 20 }, // Stay at load
    { duration: '30s', target: 0 },    // Ramp down
  ],
};

// Simple HTTP request
export default function () {
  const res = http.get('http://localhost:5000/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
`;

export const authenticationExample = `
// Load testing with authentication
import http from 'k6/http';

export function setup() {
  // Login once at the beginning
  const loginRes = http.post('http://localhost:5000/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  
  return {
    token: loginRes.json('token'),
    userId: loginRes.json('user.id'),
  };
}

export default function (data) {
  const headers = {
    'Authorization': \`Bearer \${data.token}\`,
    'Content-Type': 'application/json',
  };

  http.post(
    'http://localhost:5000/api/habits',
    JSON.stringify({ title: 'Morning exercise' }),
    { headers }
  );
}
`;

export const scenariosExample = `
// Load test with multiple scenarios and think-time
import { group, sleep } from 'k6';

export default function () {
  group('User interactions', () => {
    // Simulate user think time
    sleep(2);
    
    // Simulate browsing
    http.get('http://localhost:5000/api/habits');
    sleep(1);
    
    // Create habit
    http.post('http://localhost:5000/api/habits', payload);
    sleep(1);
    
    // View details
    http.get('http://localhost:5000/api/habits/123');
  });
}
`;

export const metricsExample = `
// Custom metrics for monitoring
import { Counter, Gauge, Trend, Rate } from 'k6/metrics';

const myCounter = new Counter('my_counter');
const myGauge = new Gauge('my_gauge');
const myTrend = new Trend('my_trend');
const myRate = new Rate('my_rate');

export default function () {
  // Increment counter
  myCounter.add(1);
  
  // Update gauge
  myGauge.set(100);
  
  // Record trend
  const res = http.get('http://localhost:5000');
  myTrend.add(res.timings.duration);
  
  // Track error rate
  check(res, {
    'status is 200': (r) => r.status === 200,
  }) || myRate.add(1);
}
`;
