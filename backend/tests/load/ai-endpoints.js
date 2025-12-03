import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const aiResponseTime = new Trend('ai_response_time');
const requestCounter = new Counter('requests');
const activeVUs = new Gauge('active_vus');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },      // Ramp up to 5 VUs
    { duration: '1m30s', target: 10 },   // Ramp up to 10 VUs
    { duration: '2m', target: 20 },      // Ramp up to 20 VUs
    { duration: '1m', target: 10 },      // Ramp down to 10 VUs
    { duration: '30s', target: 0 },      // Ramp down to 0 VUs
  ],
  thresholds: {
    'errors': ['rate<0.1'],              // Error rate < 10%
    'ai_response_time': ['p(95)<5000'],  // 95% of requests < 5s
    'http_req_duration': ['p(99)<6000'], // 99% of HTTP requests < 6s
    'http_req_failed': ['rate<0.1'],     // HTTP failure rate < 10%
  },
};

// Setup: authenticate and get token
export function setup() {
  const loginRes = http.post('http://localhost:5000/api/auth/login', {
    email: 'test@example.com',
    password: 'testpassword123',
  });

  const token = loginRes.json('token');
  return { token };
}

export default function (data) {
  const token = data.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  activeVUs.add(__VU);
  requestCounter.add(1);

  // Test 1: Get insights endpoint
  group('AI Insights', () => {
    const insightsPayload = JSON.stringify({
      timeRange: '7d',
      includePredictions: true,
    });

    const insightsRes = http.post(
      'http://localhost:5000/api/ai/insights',
      insightsPayload,
      { headers }
    );

    aiResponseTime.add(insightsRes.timings.duration);

    check(insightsRes, {
      'insights status is 200': (r) => r.status === 200,
      'insights response time < 5s': (r) => r.timings.duration < 5000,
      'insights has data': (r) => r.json('insights') !== null,
    }) || errorRate.add(1);

    sleep(1);
  });

  // Test 2: AI Coach endpoint
  group('AI Coach', () => {
    const coachPayload = JSON.stringify({
      message: 'How can I improve my sleep quality?',
      context: 'sleep_tracking',
      tone: 'supportive',
    });

    const coachRes = http.post(
      'http://localhost:5000/api/ai/coach/message',
      coachPayload,
      { headers }
    );

    aiResponseTime.add(coachRes.timings.duration);

    check(coachRes, {
      'coach status is 200': (r) => r.status === 200,
      'coach response time < 6s': (r) => r.timings.duration < 6000,
      'coach has response': (r) => r.json('response') !== null,
    }) || errorRate.add(1);

    sleep(2);
  });

  // Test 3: Meditation generation endpoint
  group('Meditation Generation', () => {
    const meditationPayload = JSON.stringify({
      duration: 10,
      theme: 'relaxation',
      voiceGender: 'neutral',
    });

    const meditationRes = http.post(
      'http://localhost:5000/api/ai/meditation',
      meditationPayload,
      { headers }
    );

    aiResponseTime.add(meditationRes.timings.duration);

    check(meditationRes, {
      'meditation status is 200': (r) => r.status === 200,
      'meditation response time < 8s': (r) => r.timings.duration < 8000,
      'meditation has content': (r) => r.json('meditation') !== null,
    }) || errorRate.add(1);

    sleep(3);
  });

  // Test 4: Goal creation with AI
  group('AI Goal Creation', () => {
    const goalPayload = JSON.stringify({
      goalStatement: 'Run a 5K in under 25 minutes',
      pillar: 'fitness',
    });

    const goalRes = http.post(
      'http://localhost:5000/api/ai/goals/smart',
      goalPayload,
      { headers }
    );

    aiResponseTime.add(goalRes.timings.duration);

    check(goalRes, {
      'goal status is 200': (r) => r.status === 200,
      'goal response time < 5s': (r) => r.timings.duration < 5000,
      'goal has smart breakdown': (r) => r.json('smart') !== null,
    }) || errorRate.add(1);

    sleep(1);
  });

  // Test 5: Journal prompt generation
  group('AI Journal Prompts', () => {
    const journalPayload = JSON.stringify({
      type: 'daily',
      depth: 'deep',
    });

    const journalRes = http.post(
      'http://localhost:5000/api/ai/journal/prompt',
      journalPayload,
      { headers }
    );

    aiResponseTime.add(journalRes.timings.duration);

    check(journalRes, {
      'journal status is 200': (r) => r.status === 200,
      'journal response time < 4s': (r) => r.timings.duration < 4000,
      'journal has prompt': (r) => r.json('prompt') !== null,
    }) || errorRate.add(1);

    sleep(1);
  });

  sleep(5); // Wait between iterations
}
