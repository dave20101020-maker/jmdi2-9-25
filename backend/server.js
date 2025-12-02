import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import aiRoutes from './routes/ai.js';
import habitsRoutes from './routes/habits.js';
import entriesRoutes from './routes/entries.js';
import pillarsRoutes from './routes/pillars.js';
import authRoutes from './routes/auth.js';
import onboardingRoutes from './routes/onboarding.js';
import subscriptionRoutes from './routes/subscription.js';
import actionPlansRoutes from './routes/actionPlans.js';
import friendsRoutes from './routes/friends.js';
import challengesRoutes from './routes/challenges.js';
import messagesRoutes from './routes/messages.js';
import notificationsRoutes from './routes/notifications.js';
import timelineRoutes from './routes/timeline.js';
import userRoutes from './routes/user.js';

// Load .env then environment-specific .env.<NODE_ENV>
dotenv.config({ path: path.resolve(process.cwd(), './backend/.env') });
const envName = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `./backend/.env.${envName}`);
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS to allow client URL when provided
const clientUrl = process.env.CLIENT_URL || true;
app.use(cors({ origin: clientUrl, credentials: true }));

// Request logging: friendly in development, structured JSON in production
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
} else {
  app.use(morgan((tokens, req, res) => {
    const obj = {
      time: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      res_header: tokens.res(req, res, 'content-length'),
      response_time_ms: Number(tokens['response-time'](req, res))
    };
    return JSON.stringify(obj);
  }));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'NorthStar Backend is running',
  });
});

// AI Routes
app.use('/api/ai', aiRoutes);

// Feature Routes
app.use('/api/habits', habitsRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/pillars', pillarsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/action-plans', actionPlansRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/user', userRoutes);

// Connect to MongoDB using MONGO_URI (preferred) or DATABASE_URL
const DB_URL = process.env.MONGO_URI || process.env.DATABASE_URL;
if (DB_URL) {
  mongoose
    .connect(DB_URL)
    .then(() => console.log(`✅ Connected to MongoDB (${envName})`))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️  MONGO_URI / DATABASE_URL not set — skipping MongoDB connection');
}

// 404 handler
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Not Found', path: req.path, method: req.method });
});

// Global error handler
import errorHandler from './middleware/errorHandler.js';
app.use((err, req, res, next) => {
  console.error('Error:', err);
  return errorHandler(err, req, res, next);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 NorthStar Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Endpoints available at http://localhost:${PORT}/api/ai`);
  });
}

export default app;
