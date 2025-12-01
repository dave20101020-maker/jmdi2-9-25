import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import aiRoutes from './routes/ai.js';
import habitsRoutes from './routes/habits.js';
import entriesRoutes from './routes/entries.js';
import pillarsRoutes from './routes/pillars.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
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

// Connect to MongoDB if DATABASE_URL is set
const DB_URL = process.env.DATABASE_URL;
if (DB_URL) {
  mongoose
    .connect(DB_URL, {
      // useNewUrlParser and useUnifiedTopology are default in mongoose v7
    })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️  DATABASE_URL not set — skipping MongoDB connection');
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 NorthStar Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Endpoints available at http://localhost:${PORT}/api/ai`);
});
