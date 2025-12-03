import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for spike testing
const errorRate = new Rate('spike_errors');
const responseTime = new Trend('spike_response_time');

export const options = {
  stages: [
    { duration: '10s', target: 10 },     // Warm up to 10 VUs
    { duration: '5s', target: 100 },     // Spike to 100 VUs
    { duration: '10s', target: 100 },    // Hold spike
    { duration: '5s', target: 10 },      // Ramp down
    { duration: '10s', target: 0 },      // Cool down
  ],
  thresholds: {
    'spike_errors': ['rate<0.2'],
    'spike_response_time': ['p(99)<8000'],
    'http_req_failed': ['rate<0.2'],
  },
};

export function setup() {
  const loginRes = http.post('http://localhost:5000/api/auth/login', {
    email: 'test@example.com',
    password: 'testpassword123',
  });

  return { token: loginRes.json('token') };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  group('Spike Test - AI Insights', () => {
    const res = http.post(
      'http://localhost:5000/api/ai/insights',
      JSON.stringify({ timeRange: '7d' }),
      { headers }
    );

    responseTime.add(res.timings.duration);

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 8s': (r) => r.timings.duration < 8000,
    }) || errorRate.add(1);
  });

  sleep(0.5);
}
