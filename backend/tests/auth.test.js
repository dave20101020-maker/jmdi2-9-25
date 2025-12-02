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
  // import app after env is set
  const mod = await import('../server.js');
  app = mod.default;
  // ensure mongoose connects
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Auth endpoints', () => {
  test('register then login', async () => {
    const email = 'testuser@example.com';
    const username = 'testuser';
    const password = 'password123';

    const regRes = await request(app).post('/api/auth/register').send({ username, email, password });
    expect(regRes.status).toBe(201);
    expect(regRes.body).toHaveProperty('success', true);
    expect(regRes.body).toHaveProperty('data');

    const loginRes = await request(app).post('/api/auth/login').send({ emailOrUsername: email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('success', true);
    expect(loginRes.body).toHaveProperty('data');
  });
});
