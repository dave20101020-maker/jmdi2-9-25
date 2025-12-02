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

// Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Validate critical environment variables
if (!JWT_SECRET && envName === 'production') {
  console.error('❌ FATAL: JWT_SECRET is required in production');
  process.exit(1);
}

if (!MONGO_URI) {
  console.warn('⚠️  MONGO_URI not set — MongoDB connection will be skipped');
}

if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set — using default (NOT SECURE for production)');
}

const app = express();

// Middleware
// Configure CORS to allow client URL
app.use(cors({ origin: CLIENT_URL, credentials: true }));

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

// Connect to MongoDB
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log(`✅ Connected to MongoDB (${envName})`);
      console.log(`📦 Database: ${mongoose.connection.name}`);
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      if (envName === 'production') {
        process.exit(1);
      }
    });
} else {
  console.warn('⚠️  MONGO_URI not set — skipping MongoDB connection');
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
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 NorthStar Backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${envName}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Endpoints: http://localhost:${PORT}/api/ai`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET ? '✓ Set' : '✗ Not set (using default)'}`);
    console.log(`🗄️  MongoDB: ${MONGO_URI ? '✓ Connected' : '✗ Not configured'}`);
    console.log(`🌐 CORS Origin: ${CLIENT_URL}`);
    console.log('='.repeat(60) + '\n');
  });
}

export default app;
