# 🚀 Error Handling Quick Start Guide

## 5-Minute Setup

### Step 1: Wrap Your Component
```jsx
import AIErrorBoundary from '@/components/AIErrorBoundary';

<AIErrorBoundary showHelp={true}>
  <YourAIComponent />
</AIErrorBoundary>
```

### Step 2: Add Error State Management
```jsx
import { useState } from 'react';
import { parseError } from '@/utils/errorHandling';

const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);
```

### Step 3: Wrap API Calls
```jsx
const handleAction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await api.post('/api/ai/endpoint', data);
    // Handle success
  } catch (err) {
    setError(parseError(err));
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Display Error UI
```jsx
import { ErrorAlert, LoadingState } from '@/components/ErrorAlert';

{loading && <LoadingState message="Loading..." />}
{error && (
  <ErrorAlert
    error={error}
    context="my feature"
    onRetry={handleAction}
    onDismiss={() => setError(null)}
  />
)}
```

---

## Common Patterns

### Pattern 1: Simple Error Handling (Most Common)
```jsx
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

const handleClick = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await api.post('/api/endpoint', data);
    // Success
  } catch (err) {
    setError(parseError(err));
  } finally {
    setLoading(false);
  }
};

return (
  <AIErrorBoundary>
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Loading...' : 'Click Me'}
    </button>
    
    {error && (
      <ErrorAlert error={error} onRetry={handleClick} />
    )}
  </AIErrorBoundary>
);
```

### Pattern 2: useAsync Hook (Cleaner)
```jsx
import { useAsync } from '@/utils/errorHandling';

const { state, execute, retry, reset } = useAsync();

const handleClick = () => {
  execute(async () => {
    return await api.post('/api/endpoint', data);
  });
};

return (
  <AIErrorBoundary>
    <button onClick={handleClick} disabled={state.loading}>
      {state.loading ? 'Loading...' : 'Click Me'}
    </button>
    
    {state.loading && <LoadingState />}
    {state.error && <ErrorAlert error={state.error} onRetry={retry} />}
    {state.success && <div>Success! {state.data}</div>}
  </AIErrorBoundary>
);
```

### Pattern 3: Safe API Call (Non-Critical Feature)
```jsx
import { safeApiCall } from '@/utils/errorHandling';

// Returns fallback instead of throwing
const data = await safeApiCall(
  () => api.get('/api/recommendations'),
  { fallback: [] }
);
```

### Pattern 4: Automatic Retry
```jsx
import { retryWithBackoff } from '@/utils/errorHandling';

try {
  const data = await retryWithBackoff(
    () => api.post('/api/critical-action', data),
    3,    // retry 3 times
    1000  // start with 1s delay
  );
  // Handle success
} catch (error) {
  // Handle failure after retries exhausted
}
```

---

## Error Message Reference

### Network Error
```
🌐 Connection Error
Unable to connect to server. Please check your internet connection.

Suggestions:
• Check internet connection
• Try moving closer to Wi-Fi
• Disable VPN if using one
```

### Timeout Error
```
⏱️ Request Timeout
The request took too long. Please try again with a shorter input.

Suggestions:
• Try with simpler request
• Wait and try again
• Service might be busy
```

### API Error (500+)
```
🤖 AI Service Unavailable
The server is temporarily unavailable. Please try again in a moment.

Suggestions:
• Server is overloaded
• Try again in few moments
• Contact support if persists
```

### Validation Error
```
⚠️ Invalid Input
Your input could not be processed. Please check format and try again.

Suggestions:
• Check input format
• Remove special characters
• Ensure required fields filled
```

### Unknown Error
```
⚠️ Something Went Wrong
An unexpected error occurred. Please try again or contact support.

Suggestions:
• Refresh the page
• Clear browser cache
• Try again in a moment
```

---

## Component Checklist

### Before Shipping an AI Component
- [ ] Wrapped with `AIErrorBoundary`
- [ ] All async calls have try/catch
- [ ] Errors parsed with `parseError()`
- [ ] Loading state shows while pending
- [ ] Error alert displays with message
- [ ] Retry button available for retryable errors
- [ ] Error suggestions shown to user
- [ ] Tested with offline/slow network
- [ ] Tested with API errors (500+)
- [ ] Tested with validation errors (400+)

---

## Troubleshooting

### "Component crashed with white screen"
→ Wrap component with `ErrorBoundary`

### "Error message is too technical"
→ Use `getUserFriendlyMessage()` instead of `error.message`

### "Retry button doesn't work"
→ Check `error.isRetryable` - validation errors can't retry

### "No error suggestions shown"
→ Use `getRecoverySuggestions()` to generate tips

### "Loading state never goes away"
→ Check that `finally` block sets `loading = false`

### "Same error multiple times"
→ Error boundary tracks count in `errorCount` state

---

## Do's & Don'ts

### DO ✅
```jsx
// Good: User-friendly message
catch (err) {
  const parsed = parseError(err);
  toast.error(getUserFriendlyMessage(parsed, 'loading data'));
}

// Good: Try/catch with finally
try {
  await api.post(url, data);
} catch (err) {
  handleError(err);
} finally {
  setLoading(false);
}

// Good: Provide retry
<ErrorAlert error={error} onRetry={handleClick} />

// Good: Show loading state
{loading && <LoadingState />}

// Good: Wrap with boundary
<AIErrorBoundary><MyComponent /></AIErrorBoundary>
```

### DON'T ❌
```jsx
// Bad: Raw error to user
catch (err) {
  toast.error(err.message); // Too technical!
}

// Bad: No loading state
<button onClick={handleClick}>Click</button> // No feedback

// Bad: Ignore error
try {
  await api.post(url, data);
} // No catch!

// Bad: No retry option
{error && <div>{error}</div>} // User stuck

// Bad: Unprotected component
<AIInsights /> // Can crash!
```

---

## Files You Need to Know

| File | Purpose | Import From |
|------|---------|------------|
| `ErrorBoundary.jsx` | Catch any error | `@/components/ErrorBoundary` |
| `AIErrorBoundary.jsx` | Catch AI errors | `@/components/AIErrorBoundary` |
| `ErrorAlert.jsx` | Show error UI | `@/components/ErrorAlert` |
| `errorHandling.js` | Parse & handle errors | `@/utils/errorHandling` |

---

## Examples in Codebase

**Good Examples:**
- `src/pages/Dashboard.jsx` - Error boundary wrapping
- `src/pages/MentalHealth.jsx` - AIErrorBoundary usage
- `src/ai/AIInsights.jsx` - Try/catch pattern
- `src/ai/ERROR_HANDLING_GUIDE.jsx` - All patterns

**Try These:**
```bash
# Open and read examples
cat src/ai/ERROR_HANDLING_GUIDE.jsx

# See implementation
cat src/components/AIErrorBoundary.jsx

# Check utilities
cat src/utils/errorHandling.js

# Read documentation
cat ERROR_HANDLING_README.md
```

---

## Testing Quick Reference

### Test Network Error
```
1. DevTools → Network
2. Check "Offline"
3. Try API call
4. Should show network error
5. Enable network, click Retry
```

### Test Timeout
```
1. DevTools → Network
2. Set to "Slow 3G"
3. Try long operation
4. Should show timeout
5. Click Retry
```

### Test API Error
```
1. Backend returns 500
2. Frontend shows API error
3. Shows recovery suggestions
4. Click Retry works
```

### Test Component Error
```
1. Component throws in render
2. Error boundary catches it
3. Shows error UI
4. Click "Try Again"
```

---

## One-Minute Reference

**Imports you need:**
```jsx
import AIErrorBoundary from '@/components/AIErrorBoundary';
import { ErrorAlert, LoadingState } from '@/components/ErrorAlert';
import { parseError } from '@/utils/errorHandling';
```

**Basic template:**
```jsx
export default function MyComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/endpoint', data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AIErrorBoundary>
      <button onClick={handleAction} disabled={loading}>
        {loading ? 'Loading...' : 'Click'}
      </button>
      {loading && <LoadingState />}
      {error && <ErrorAlert error={error} onRetry={handleAction} />}
    </AIErrorBoundary>
  );
}
```

---

## Cheat Sheet

| Need | Code |
|------|------|
| Wrap component | `<AIErrorBoundary><Comp /></AIErrorBoundary>` |
| Parse error | `const err = parseError(error)` |
| User message | `getUserFriendlyMessage(err, 'context')` |
| Suggestions | `getRecoverySuggestions(err)` |
| Show error | `<ErrorAlert error={error} onRetry={retry} />` |
| Show loading | `<LoadingState message="Loading..." />` |
| Is retryable | `if (error.isRetryable) { ... }` |
| Auto retry | `await retryWithBackoff(fn, 3, 1000)` |
| Safe call | `await safeApiCall(fn, {fallback: []})` |
| useAsync hook | `const {state, execute, retry} = useAsync()` |

---

## Next Steps

1. **Read** `ERROR_HANDLING_README.md` for full overview
2. **Check** `ERROR_HANDLING_GUIDE.jsx` for examples
3. **Apply** patterns to your components
4. **Test** error scenarios (offline, slow, API error)
5. **Deploy** with confidence!

---

**Need help?** Check the documentation files or look at implemented examples in Dashboard.jsx and MentalHealth.jsx
