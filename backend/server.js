// Load environment variables FIRST before any other imports
import './loadEnv.js';

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
import aiRoutes from './routes/ai.js';
import orchestratorRoutes from './routes/aiRoutes.js';
import { aiRateLimitMiddleware } from './middleware/rateLimiter.js';
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
import integrationsRoutes from './routes/integrations.js';

const envName = process.env.NODE_ENV || 'development';

// Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Validate critical environment variables
if (!JWT_SECRET && envName === 'production') {
  logger.error('FATAL: JWT_SECRET is required in production');
  process.exit(1);
}

if (!MONGO_URI) {
  logger.warn('MONGO_URI not set — MongoDB connection will be skipped');
}

if (!JWT_SECRET) {
  logger.warn('JWT_SECRET not set — using default (NOT SECURE for production)');
}

const app = express();

// Middleware
// Configure CORS to allow client URL and GitHub Codespaces
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow localhost and CLIENT_URL
    const allowedOrigins = [
      CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:5000'
    ];
    
    // Allow any GitHub Codespaces domain
    if (origin.includes('.github.dev') || origin.includes('.githubpreview.dev')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Request logging with Winston
app.use(morgan('combined', { stream: logger.stream }));

// Response time tracking middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res.statusCode, responseTime);
  });
  
  next();
});

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

// AI Routes (legacy)
app.use('/api/ai', aiRoutes);

// NorthStar Orchestrator Routes (new)
app.use('/api/orchestrator', orchestratorRoutes);

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
app.use('/api/integrations', integrationsRoutes);

// Connect to MongoDB
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      logger.info('Connected to MongoDB', { 
        environment: envName,
        database: mongoose.connection.name 
      });
    })
    .catch((err) => {
      logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
      if (envName === 'production') {
        process.exit(1);
      }
    });
} else {
  logger.warn('MONGO_URI not set — skipping MongoDB connection');
}

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found', { path: req.path, method: req.method, ip: req.ip });
  res.status(404).json({ error: true, message: 'Not Found', path: req.path, method: req.method });
});

// Global error handler
import errorHandler from './middleware/errorHandler.js';
app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    path: req.path,
    userId: req.user?.id || req.user?.email,
    ip: req.ip,
  });
  return errorHandler(err, req, res, next);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info('NorthStar Backend started', {
      port: PORT,
      environment: envName,
      healthCheck: `http://localhost:${PORT}/health`,
      aiEndpoints: `http://localhost:${PORT}/api/ai`,
      jwtConfigured: !!JWT_SECRET,
      mongoConfigured: !!MONGO_URI,
      corsOrigin: CLIENT_URL,
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 NorthStar Backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${envName}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Endpoints: http://localhost:${PORT}/api/ai`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET ? '✓ Set' : '✗ Not set (using default)'}`);
    console.log(`🗄️  MongoDB: ${MONGO_URI ? '✓ Connected' : '✗ Not configured'}`);
    console.log(`🌐 CORS Origin: ${CLIENT_URL}`);
    console.log(`📝 Logs: ./logs/`);
    console.log('='.repeat(60) + '\n');
  });
}

export default app;
