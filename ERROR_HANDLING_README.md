# Error Handling & Resilience System

## Overview

NorthStar now has a comprehensive error handling system that makes the app resilient to AI failures, network issues, and unexpected errors. Users see friendly error messages with recovery options instead of blank screens or crashes.

## Components Created

### 1. **ErrorBoundary** (`src/components/ErrorBoundary.jsx`)
- Catches JavaScript errors anywhere in component tree
- Displays friendly error UI with retry and reload options
- Logs errors to console (dev mode shows full stack traces)
- Integrates with Sentry (if configured)

**Usage:**
```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. **AIErrorBoundary** (`src/components/AIErrorBoundary.jsx`)
- Specialized error boundary for AI-related components
- Categorizes errors (network, timeout, API, validation)
- Provides context-specific recovery suggestions
- Shows helpful troubleshooting tips

**Usage:**
```jsx
<AIErrorBoundary showHelp={true}>
  <AIInsights />
</AIErrorBoundary>
```

### 3. **Error Handling Utilities** (`src/utils/errorHandling.js`)
- `parseError(error)` - Standardizes error objects
- `getUserFriendlyMessage(error, context)` - User-friendly messages
- `getRecoverySuggestions(error)` - Recovery tips for each error type
- `useAsync(initialState)` - React hook for async state management
- `retryWithBackoff(fn, maxRetries, initialDelay)` - Automatic retry with exponential backoff
- `isRetryable(error)` - Check if error can be retried
- `safeApiCall(fn, options)` - Safe wrapper with fallback value

### 4. **Error Alert Components** (`src/components/ErrorAlert.jsx`)
- `ErrorAlert` - Inline error display with retry button
- `LoadingState` - Loading spinner with message
- `EmptyState` - Empty data state message
- `SuccessAlert` - Success notification

**Usage:**
```jsx
{error && (
  <ErrorAlert
    error={error}
    context="sentiment analysis"
    onRetry={handleRetry}
    onDismiss={handleDismissError}
    showSuggestions={true}
  />
)}
```

### 5. **Error Handling Guide** (`src/ai/ERROR_HANDLING_GUIDE.jsx`)
- Complete guide with examples
- Best practices checklist
- Component wrapping patterns
- Common usage scenarios

## Components Now Protected

### Wrapped with Error Boundaries:

1. **Dashboard.jsx**
   - Wrapped entire dashboard with `ErrorBoundary`
   - AIInsights wrapped with `AIErrorBoundary`
   - GuidedTour wrapped with `ErrorBoundary`

2. **MentalHealth.jsx**
   - GuidedJournal wrapped with `AIErrorBoundary`

All AI components now have safe fallback UIs and recovery options.

## Error Types & Recovery

### Network Errors
- **Message:** "Unable to connect to server. Please check your internet connection."
- **Suggestions:**
  - Check internet connection
  - Try moving closer to Wi-Fi
  - Disable VPN if using one
  - Refresh page and try again

### Timeout Errors
- **Message:** "The request took too long. Please try again with a shorter input."
- **Suggestions:**
  - Try with simpler request
  - Wait a moment and try again
  - Service may be busy, try later

### API Errors (500+)
- **Message:** "The server is temporarily unavailable. Please try again in a moment."
- **Suggestions:**
  - Server is overloaded
  - Try again in few moments
  - Contact support if persists

### Validation Errors (400-499)
- **Message:** "Invalid input. Please check your data and try again."
- **Suggestions:**
  - Check input format
  - Remove special characters
  - Ensure all required fields filled

### Unknown Errors
- **Message:** "An unexpected error occurred. Please try again or contact support."
- **Suggestions:**
  - Refresh page
  - Clear browser cache
  - Try again in moment
  - Contact support

## Best Practices

### ✅ DO:
1. Wrap AI components with `AIErrorBoundary`
2. Use `ErrorAlert` for inline error display
3. Always parse errors with `parseError()`
4. Show loading state while async call pending
5. Provide retry button for retryable errors
6. Use `getUserFriendlyMessage()` for user messages
7. Show recovery suggestions
8. Use `useAsync` hook for cleaner state management
9. Use `safeApiCall` for non-critical features
10. Test error scenarios (network failure, timeout)

### ❌ DON'T:
1. Expose technical error messages to users
2. Ignore errors - always handle them
3. Let async errors crash components
4. Use generic "Something went wrong" messages
5. Show API status codes to users
6. Retry immediately without delay
7. Leave users without recovery option
8. Display raw error objects in production
9. Forget to reset error state after retry
10. Use different patterns in different components

## Backend Error Format

All backend errors use standardized format:
```json
{
  "error": true,
  "message": "Human-friendly error message",
  "code": 400
}
```

See `backend/middleware/errorHandler.js` for implementation.

## Advanced Usage

### Example: Component with Full Error Handling

```jsx
import { useState } from 'react';
import { ErrorAlert, LoadingState } from '@/components/ErrorAlert';
import { parseError, getUserFriendlyMessage } from '@/utils/errorHandling';
import AIErrorBoundary from '@/components/AIErrorBoundary';
import { api } from '@/utils/apiClient';

export default function MyAIComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/ai/endpoint', { data: 'value' });
      setResult(response.data);
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleAction();
  };

  return (
    <AIErrorBoundary showHelp={true}>
      <div>
        <button onClick={handleAction} disabled={loading}>
          {loading ? 'Loading...' : 'Execute'}
        </button>

        {loading && <LoadingState message="Processing..." />}
        
        {error && (
          <ErrorAlert
            error={error}
            context="my feature"
            onRetry={handleRetry}
            onDismiss={() => setError(null)}
            showSuggestions={true}
          />
        )}

        {result && <div>Success: {JSON.stringify(result)}</div>}
      </div>
    </AIErrorBoundary>
  );
}
```

### Example: Using useAsync Hook

```jsx
import { useAsync } from '@/utils/errorHandling';
import { ErrorAlert, LoadingState } from '@/components/ErrorAlert';

export default function MyComponent() {
  const { state, execute, retry, reset } = useAsync();

  const handleClick = () => {
    execute(async () => {
      const response = await fetch('/api/data');
      return response.json();
    });
  };

  return (
    <div>
      <button onClick={handleClick} disabled={state.loading}>
        Load Data
      </button>

      {state.loading && <LoadingState />}
      {state.error && (
        <ErrorAlert error={state.error} onRetry={retry} onDismiss={reset} />
      )}
      {state.success && <div>Success: {state.data}</div>}
    </div>
  );
}
```

### Example: Automatic Retry with Backoff

```jsx
import { retryWithBackoff } from '@/utils/errorHandling';

// Automatically retries up to 3 times with exponential backoff
const data = await retryWithBackoff(
  () => api.get('/api/ai/data'),
  3,      // max retries
  1000    // initial delay (ms)
);
```

### Example: Safe API Call (Non-Critical Feature)

```jsx
import { safeApiCall } from '@/utils/errorHandling';

// Returns fallback value instead of throwing
const recommendations = await safeApiCall(
  () => api.get('/api/ai/recommendations'),
  {
    fallback: [],
    context: 'loading recommendations',
    maxRetries: 2,
    onError: (error, message) => {
      console.error(message);
    }
  }
);
```

## Testing Error Scenarios

### Simulate Network Error
```js
// In Chrome DevTools Network tab:
// 1. Open Network tab
// 2. Click "Offline" checkbox
// 3. Try API call
// 4. App shows network error with recovery suggestions
```

### Simulate API Error
```js
// Backend returns error:
res.status(500).json({ error: true, message: 'Service unavailable' })
// Frontend automatically parses and displays friendly message
```

### Simulate Timeout
```js
// Add delay in backend or slow network
// useAsync hook will detect timeout and show message
```

## Monitoring & Debugging

### Development Mode
- Full error details shown
- Component stack traces visible
- Detailed console logging

### Production Mode
- User-friendly messages only
- No technical details exposed
- Errors sent to Sentry (if configured)

## Future Enhancements

1. **Error Reporting Dashboard** - View aggregated error patterns
2. **Sentry Integration** - Full error tracking and analytics
3. **Error Recovery Wizard** - Guide users through fixing issues
4. **Offline Mode** - Work with limited features without network
5. **Error Analytics** - Track common error patterns
6. **Automated Error Messages** - Context-aware suggestions based on error history

## Support

For questions about error handling:
1. Check `ERROR_HANDLING_GUIDE.jsx` for examples
2. Review best practices section above
3. Look at implemented components (Dashboard, MentalHealth)
4. Contact support if issues persist
