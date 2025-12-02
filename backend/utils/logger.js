import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log directory
const logDir = path.join(__dirname, '../../logs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Error log file - rotates daily
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxFiles: '30d', // Keep logs for 30 days
    maxSize: '20m', // Rotate if file exceeds 20MB
    format: logFormat,
  }),

  // Combined log file - all levels - rotates daily
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d', // Keep logs for 14 days
    maxSize: '20m',
    format: logFormat,
  }),

  // HTTP log file - request/response logging
  new DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxFiles: '7d', // Keep logs for 7 days
    maxSize: '20m',
    format: logFormat,
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging

/**
 * Log HTTP request
 */
logger.logRequest = (req, statusCode, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || req.user?.email || 'anonymous',
  };

  if (statusCode >= 500) {
    logger.error('HTTP Request Error', logData);
  } else if (statusCode >= 400) {
    logger.warn('HTTP Request Warning', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

/**
 * Log database operations
 */
logger.logDatabase = (operation, collection, query = {}, duration = null) => {
  const logData = {
    operation,
    collection,
    query: JSON.stringify(query),
  };

  if (duration) {
    logData.duration = `${duration}ms`;
  }

  logger.debug('Database Operation', logData);
};

/**
 * Log authentication events
 */
logger.logAuth = (event, userId, details = {}) => {
  logger.info('Authentication Event', {
    event,
    userId,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log security events
 */
logger.logSecurity = (event, severity = 'warn', details = {}) => {
  const logData = {
    event,
    severity,
    ...details,
    timestamp: new Date().toISOString(),
  };

  if (severity === 'critical' || severity === 'high') {
    logger.error('Security Event', logData);
  } else {
    logger.warn('Security Event', logData);
  }
};

/**
 * Log API errors
 */
logger.logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...context,
  };

  logger.error('Application Error', errorData);
};

/**
 * Log business logic events
 */
logger.logBusiness = (event, data = {}) => {
  logger.info('Business Event', {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Log performance metrics
 */
logger.logPerformance = (operation, duration, metadata = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  };

  if (duration > 1000) {
    logger.warn('Slow Operation', logData);
  } else {
    logger.debug('Performance Metric', logData);
  }
};

/**
 * Log AI/OpenAI requests
 */
logger.logAI = (operation, tokens = null, model = null, duration = null) => {
  const logData = {
    operation,
    model,
    tokens,
    duration: duration ? `${duration}ms` : null,
  };

  logger.info('AI Operation', logData);
};

// Log uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    format: logFormat,
  })
);

// Log unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'rejections.log'),
    format: logFormat,
  })
);

// Export logger
export default logger;

/**
 * Usage Examples:
 * 
 * import logger from './utils/logger.js';
 * 
 * // Basic logging
 * logger.info('Server started on port 5000');
 * logger.error('Database connection failed', { error: err.message });
 * logger.warn('Rate limit exceeded', { ip: req.ip });
 * logger.debug('Processing request', { userId: 123 });
 * 
 * // HTTP request logging
 * logger.logRequest(req, 200, 45);
 * 
 * // Database logging
 * logger.logDatabase('find', 'users', { email: 'user@example.com' }, 23);
 * 
 * // Authentication logging
 * logger.logAuth('login_success', 'user@example.com', { ip: req.ip });
 * logger.logAuth('login_failed', 'user@example.com', { reason: 'Invalid password' });
 * 
 * // Security logging
 * logger.logSecurity('suspicious_activity', 'high', { 
 *   userId: 'user123',
 *   action: 'Multiple failed login attempts',
 *   ip: req.ip 
 * });
 * 
 * // Error logging
 * logger.logError(error, { 
 *   userId: req.user?.id,
 *   endpoint: req.path 
 * });
 * 
 * // Business events
 * logger.logBusiness('pillar_score_updated', {
 *   userId: 'user123',
 *   pillar: 'sleep',
 *   oldScore: 60,
 *   newScore: 75
 * });
 * 
 * // Performance monitoring
 * const start = Date.now();
 * // ... some operation
 * logger.logPerformance('calculate_life_score', Date.now() - start, { userId: 'user123' });
 * 
 * // AI operations
 * logger.logAI('coach_message', 1250, 'gpt-4-turbo', 2300);
 */
