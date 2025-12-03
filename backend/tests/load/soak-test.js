import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Metrics for soak testing
const errorRate = new Rate('soak_errors');
const responseTime = new Trend('soak_response_time');

export const options = {
  stages: [
    { duration: '2m', target: 50 },      // Warm up to 50 VUs
    { duration: '10m', target: 50 },     // Sustained load for 10 minutes
    { duration: '2m', target: 0 },       // Cool down
  ],
  thresholds: {
    'soak_errors': ['rate<0.05'],
    'soak_response_time': ['p(95)<5000'],
    'http_req_failed': ['rate<0.05'],
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

  group('Sustained Load - AI Coach', () => {
    const res = http.post(
      'http://localhost:5000/api/ai/coach/message',
      JSON.stringify({
        message: 'How am I doing with my goals?',
        context: 'progress_check',
      }),
      { headers }
    );

    responseTime.add(res.timings.duration);

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 6s': (r) => r.timings.duration < 6000,
      'has valid response': (r) => r.json('response') !== null,
    }) || errorRate.add(1);
  });

  sleep(2);
}
