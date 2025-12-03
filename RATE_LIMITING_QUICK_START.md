# Rate Limiting & Cost Protection - Quick Reference

## ✅ Implementation Complete

All rate limiting and cost protection has been implemented for AI routes in NorthStar.

### What Was Implemented

#### 1. Backend Rate Limiting (10 req/minute per user)
- **File**: `backend/middleware/rateLimiter.js`
- **Library**: express-rate-limit v6.11.2
- **Limits**:
  - AI routes: 10 requests/minute per authenticated user
  - General API: 30 requests/minute
  - Auth endpoints: 5 requests/minute per IP

#### 2. AI Activity Logging
- **File**: `backend/middleware/aiLogging.js`
- **Logs**:
  - User ID / IP address
  - Route/endpoint
  - Method (POST, GET, etc.)
  - Response status code
  - Response time (ms)
  - Request/response sizes
  - Timestamp (ISO 8601)

#### 3. Cost Tracking
- **Location**: `backend/middleware/aiLogging.js` (costTrackingMiddleware)
- **Tracking**:
  - Estimated cost per endpoint ($0.0001 - $0.002)
  - Accumulates for billing/monitoring
  - Logs cost events for each successful request

#### 4. Frontend Error Handling
- **Files Modified**:
  - `src/utils/errorHandling.js` - Enhanced parseError() for 429 detection
  - `src/components/ErrorAlert.jsx` - Shows rate limit messages
  
- **Features**:
  - Detects HTTP 429 (Too Many Requests)
  - Shows user-friendly message: "Too many AI requests. Please slow down..."
  - Displays retry countdown with seconds remaining
  - Provides recovery suggestions
  - Retry button (disabled until ready to retry)

### How It Works

```
User Request → Backend Auth → Rate Limiter Check
                                    ↓
                            Within Limit? 
                           ✓ Yes / ✗ No
                           ↓       ↓
                    Continue   429 Error
                    Process    Response
                       ↓
                   Logging
                   (Cost, status, time)
                       ↓
                  LLM API Call
                       ↓
                  Response to Frontend
```

### Rate Limit Response Example

```json
{
  "error": true,
  "message": "Too many AI requests. Please slow down. Try again in 45 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45,
  "resetTime": "2025-12-03T12:34:56.000Z"
}
```

### Rate Limit Headers

Every response includes:
- `RateLimit-Limit: 10` - Maximum requests allowed
- `RateLimit-Remaining: 5` - Requests left in window
- `RateLimit-Reset: 2025-12-03T12:34:56Z` - When limit resets
- `Retry-After: 45` - Seconds to wait (only if rate limited)

### Frontend User Experience

When a user hits the rate limit:

1. ✅ Error banner appears with red styling
2. ✅ Clear message: "Too many AI requests. Please slow down."
3. ✅ Countdown timer: "Try again in 45 seconds"
4. ✅ Recovery suggestions shown
5. ✅ Retry button disabled (auto-enables after countdown)
6. ✅ User can click Dismiss to close banner

### Testing Rate Limiting

**Make 11 rapid requests to hit the limit:**
```bash
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/ai/orchestrator \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}'
done
```

**11th request returns 429 with message**

**Check logs:**
```bash
tail -f ./backend/logs/combined.log | grep "AI"
```

### Configuration

**To change limits (in `backend/middleware/rateLimiter.js`):**

```javascript
// AI routes: Change max: 10 to desired number
export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 10,                    // Requests per minute (CHANGE THIS)
  ...
})
```

**To update cost estimates (in `backend/middleware/aiLogging.js`):**

```javascript
const costs = {
  '/api/ai/transcribe': 0.0001,      // Update prices
  '/api/ai/sentiment': 0.0001,
  '/api/ai/orchestrator': 0.002,
  '/api/ai/agent': 0.002,
  ...
}
```

### Production Recommendations

1. **Use Redis for distributed rate limiting**
   - Current: In-memory (single server only)
   - Production: Install `rate-limit-redis`
   - Shares rate limit data across multiple backend servers

2. **Set up cost monitoring**
   - Alert if daily cost exceeds threshold ($100+)
   - Track cost per user
   - Implement tiered rate limits by subscription

3. **Monitor abuse patterns**
   - Alert if rate limit hits > 10/hour
   - Detect bot patterns
   - Implement temporary IP blocks if needed

### Files Created/Modified

| File | Size | Purpose |
|------|------|---------|
| `backend/middleware/rateLimiter.js` | 3.8K | Rate limiting config (express-rate-limit) |
| `backend/middleware/aiLogging.js` | 4.3K | Request logging & cost tracking |
| `backend/routes/ai.js` | 2.1K | Added middleware to AI routes |
| `src/utils/errorHandling.js` | 9.3K | Enhanced error parsing for 429 |
| `src/components/ErrorAlert.jsx` | N/A | Shows rate limit messages |
| `RATE_LIMITING_GUIDE.js` | 8K | Comprehensive implementation guide |

### Key Metrics

- **Users per minute before rate limit**: 10 AI requests
- **Cost per transcription**: $0.0001
- **Cost per sentiment analysis**: $0.0001
- **Cost per orchestrator call**: $0.002
- **Cost per pillar agent**: $0.002
- **Cost per crisis check**: $0.001

### Support

For detailed implementation information, see: `RATE_LIMITING_GUIDE.js`

---

**Last Updated**: December 3, 2025
**Status**: ✅ Complete and Ready for Production
