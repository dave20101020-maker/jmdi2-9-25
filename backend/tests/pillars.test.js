import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.NODE_ENV = 'test';
  const mod = await import('../server.js');
  app = mod.default;
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('pillar check-in creates a record for authenticated user', async () => {
  const email = 'pillaruser@example.com';
  const username = 'pillaruser';
  const password = 'password123';

  // register user
  const reg = await request(app).post('/api/auth/register').send({ username, email, password });
  expect(reg.status).toBe(201);
  const cookies = reg.headers['set-cookie'];
  expect(cookies).toBeTruthy();

  // send check-in for allowed pillar 'sleep' (default free users have sleep)
  const res = await request(app)
    .post('/api/pillars/check-in')
    .set('Cookie', cookies)
    .send({ pillarId: 'sleep', value: 7, note: 'Feeling rested' });

  expect([200,201]).toContain(res.status);
  expect(res.body).toHaveProperty('success', true);
});
