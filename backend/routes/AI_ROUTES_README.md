/**
 * Server Integration Guide
 * 
 * How to integrate the new AI routes into your Express server
 * 
 * File: backend/server.js or similar
 */

// In your server.js file, add these imports at the top:
// import aiRoutes from './routes/aiRoutes.js';
// import { aiRateLimitMiddleware } from './middleware/rateLimiter.js';

// Then add this to your Express app setup (after bodyParser):

/*
// API Routes
app.use('/api/ai', aiRoutes);

// Or with additional middleware:
app.use('/api/ai', (req, res, next) => {
  // Add authentication check if needed:
  // if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}, aiRoutes);
*/

// ============================================
// QUICK START - Copy this to your server.js
// ============================================

/*
import aiRoutes from './routes/aiRoutes.js';

// In your Express app setup:
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add AI routes
app.use('/api/ai', aiRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI routes available at http://localhost:${PORT}/api/ai`);
});
*/

// ============================================
// ENDPOINTS NOW AVAILABLE
// ============================================

/*

1. HEALTH CHECK (no auth required, no rate limiting)
   GET /api/ai/health
   
   Response:
   {
     "ok": true,
     "service": "NorthStar AI",
     "status": "operational",
     "timestamp": "2024-11-21T12:34:56.789Z"
   }

2. MAIN CHAT ENDPOINT (rate limited: 30 req/min per user)
   POST /api/ai/chat
   
   Body:
   {
     "message": "Help me sleep better tonight",
     "pillar": "sleep" (optional - omit for auto-detect),
     "explicitMode": false (optional)
   }
   
   Response:
   {
     "ok": true,
     "agent": "sleepAgent",
     "pillar": "sleep",
     "response": "Dr. Luna's response here...",
     "memory": {
       "pillarNames": ["sleep", "mentalHealth", ...],
       "lastUpdated": "2024-11-21T12:34:56.789Z"
     },
     "rateLimit": {
       "limit": 30,
       "remaining": 29,
       "reset": "2024-11-21T12:35:56.789Z"
     }
   }

3. GET USER MEMORY (dev only, no rate limiting)
   GET /api/ai/memory
   
   Response:
   {
     "ok": true,
     "userId": "user123",
     "memory": { ... }
   }

4. RESET USER MEMORY (dev only, no rate limiting)
   POST /api/ai/reset
   
   Response:
   {
     "ok": true,
     "message": "Memory cleared",
     "userId": "user123"
   }

5. GET AGENT INFO (all 8 agents, capabilities, icons)
   GET /api/ai/agents
   
   Response:
   {
     "ok": true,
     "agents": {
       "sleep": { "name": "Dr. Luna", ... },
       "mentalHealth": { "name": "Dr. Serenity", ... },
       ...
     },
     "count": 8
   }

*/

// ============================================
// EXAMPLE REQUESTS (curl)
// ============================================

/*

# Health check
curl http://localhost:5000/api/ai/health

# Get agent info
curl http://localhost:5000/api/ai/agents

# Chat with auto-detect
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I want to start a fitness routine"}'

# Chat with specific pillar
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"My knee hurts when running","pillar":"fitness"}'

# Get memory
curl http://localhost:5000/api/ai/memory

# Reset memory
curl -X POST http://localhost:5000/api/ai/reset

*/

// ============================================
// RATE LIMITING INFO
// ============================================

/*

Rate limits are per user (by userId or IP):

- /api/ai/chat: 30 requests/minute (expensive API calls)
- /api/ai/*: 100 requests/minute (general endpoints)
- /auth/*: 5 requests/minute (brute force prevention)

When limit exceeded:
- Status: 429 (Too Many Requests)
- Retry-After: seconds until reset
- X-RateLimit-* headers in response

Response:
{
  "ok": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in 45 seconds.",
  "retryAfter": 45,
  "resetTime": "2024-11-21T12:35:56.789Z"
}

*/

// ============================================
// SECURITY
// ============================================

/*

The following security measures are applied:

1. SANITIZATION (sanitizationMiddleware)
   - Prevents prompt injection attacks
   - Blocks explicit content keywords
   - Detects harmful intent
   - Removes system prompt leakage

2. RATE LIMITING (aiRateLimitMiddleware)
   - 30 req/min per user for AI routes
   - Prevents cost explosions
   - Prevents brute force attacks

3. INPUT VALIDATION
   - Message required and non-empty
   - Message length limits
   - Format validation

4. ERROR HANDLING
   - No internal error details exposed
   - Development mode shows full errors
   - Proper HTTP status codes

*/

// ============================================
// AUTHENTICATION (OPTIONAL)
// ============================================

/*

To add authentication, modify the aiRoutes.js:

Before the route handlers, add:

router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: 'Authentication required'
    });
  }
  next();
});

Then userId will be extracted from req.user.id

*/

export const SERVER_INTEGRATION_COMPLETE = true;
