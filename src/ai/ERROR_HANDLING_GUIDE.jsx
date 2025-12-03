/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Component Error Handling Guide & Examples
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This file documents best practices for handling errors in AI components.
 * Use these patterns for all async calls (transcription, sentiment, orchestrator, etc.)
 */

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Basic Component with Error Handling
// ═════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ErrorAlert, LoadingState, SuccessAlert, EmptyState } from '@/components/ErrorAlert';
import { parseError } from '@/utils/errorHandling';
import { api } from '@/utils/apiClient';
import AIErrorBoundary from '@/components/AIErrorBoundary';
import { RefreshCw } from 'lucide-react';

/**
 * Example: AI Sentiment Analysis Component
 * 
 * Shows best practices for:
 * - Loading state
 * - Error state with retry
 * - Success state
 * - Wrapped in AIErrorBoundary for safety
 */
export function ExampleSentimentComponent() {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError({
        type: 'validation',
        message: 'Please enter some text to analyze',
        isRetryable: false,
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSentiment(null);

    try {
      const response = await api.post('/api/ai/sentiment', { text: input });
      setSentiment(response.data);
    } catch (err) {
      // Parse error using standardized error handling
      const parsed = parseError(err);
      setError(parsed);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleAnalyze();
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <AIErrorBoundary showHelp={true}>
      <div className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to analyze..."
          className="w-full p-3 border rounded"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>

        {/* Loading State */}
        {loading && <LoadingState message="Analyzing sentiment..." />}

        {/* Error State */}
        {error && (
          <ErrorAlert
            error={error}
            context="sentiment analysis"
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            showSuggestions={true}
          />
        )}

        {/* Success State */}
        {sentiment && !loading && (
          <div className="p-4 bg-green-100 rounded">
            <p>
              Sentiment: <strong>{sentiment.sentiment}</strong> ({sentiment.score}%)
            </p>
          </div>
        )}
      </div>
    </AIErrorBoundary>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Using the useAsync Hook for Cleaner Code
// ═════════════════════════════════════════════════════════════════════════════

import { useAsync } from '@/utils/errorHandling';

/**
 * Example: AI Transcription Component using useAsync Hook
 * 
 * The useAsync hook reduces boilerplate for async state management.
 */
export function ExampleTranscriptionComponent() {
  const audioInput = React.useRef();
  const { state, execute, reset } = useAsync();

  const handleTranscribe = async () => {
    const file = audioInput.current?.files?.[0];
    if (!file) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    execute(async () => {
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    });
  };

  return (
    <AIErrorBoundary showHelp={true}>
      <div className="space-y-4">
        <input
          ref={audioInput}
          type="file"
          accept="audio/*"
          className="block"
        />

        <button
          onClick={handleTranscribe}
          disabled={state.loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {state.loading ? 'Transcribing...' : 'Transcribe Audio'}
        </button>

        {/* Hook provides clean state access */}
        {state.loading && <LoadingState message="Transcribing audio..." />}

        {state.error && (
          <ErrorAlert
            error={state.error}
            context="audio transcription"
            onRetry={handleTranscribe}
            onDismiss={reset}
            showSuggestions={true}
          />
        )}

        {state.success && state.data && (
          <div className="p-4 bg-green-100 rounded">
            <p>Transcribed: {state.data.text}</p>
          </div>
        )}
      </div>
    </AIErrorBoundary>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Retry Logic with Exponential Backoff
// ═════════════════════════════════════════════════════════════════════════════

import { retryWithBackoff, isRetryable } from '@/utils/errorHandling';

/**
 * Example: Automatic Retry with Backoff
 * 
 * Useful for transient errors (network, timeout).
 * Automatically retries with exponential backoff.
 */
export async function exampleRetryWithBackoff() {
  try {
    const result = await retryWithBackoff(
      async () => {
        // This function will be retried up to 3 times with exponential backoff
        const response = await api.post('/api/ai/orchestrator', {
          message: 'Hello, Coach!',
        });
        return response.data;
      },
      3, // maxRetries
      1000 // initialDelay in ms
    );

    console.log('Success:', result);
  } catch (error) {
    // Only reached if all retries fail AND error is not retryable
    console.error('Failed after retries:', error);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Safe API Call Wrapper
// ═════════════════════════════════════════════════════════════════════════════

import { safeApiCall } from '@/utils/errorHandling';

/**
 * Example: Safe API Call with Fallback
 * 
 * Returns fallback value instead of throwing,
 * useful for non-critical features.
 */
export async function exampleSafeApiCall() {
  // This will NOT throw - returns fallback on error
  const insights = await safeApiCall(
    async () => {
      const response = await api.get('/api/ai/insights');
      return response.data;
    },
    {
      fallback: [], // Return empty array on error
      context: 'loading insights',
      maxRetries: 2,
      onError: (error, message) => {
        console.error(`Failed to load insights: ${message}`);
        // Show toast notification
      },
    }
  );

  // insights is never null, always has a value
  return insights;
}

// ═════════════════════════════════════════════════════════════════════════════
// BEST PRACTICES CHECKLIST
// ═════════════════════════════════════════════════════════════════════════════

/**
 * ✅ DO:
 * 
 * 1. Wrap AI components with AIErrorBoundary for safety
 * 2. Use ErrorAlert component for inline error display
 * 3. Always parse errors with parseError() for standardization
 * 4. Show loading state while async call is pending
 * 5. Provide retry button for retryable errors
 * 6. Use user-friendly messages from getUserFriendlyMessage()
 * 7. Show recovery suggestions from getRecoverySuggestions()
 * 8. Use useAsync hook for cleaner async state management
 * 9. Use safeApiCall for non-critical features that should have fallbacks
 * 10. Test error scenarios (network failure, timeout, API error)
 */

/**
 * ❌ DON'T:
 * 
 * 1. Expose technical error messages to users
 * 2. Ignore errors - always handle them
 * 3. Let async errors crash the component (use error boundaries)
 * 4. Use generic "Something went wrong" messages
 * 5. Show API status codes or internal details to users
 * 6. Retry immediately without delay (causes hammering)
 * 7. Leave users without a way to recover (no retry button)
 * 8. Display raw error objects or stack traces in production
 * 9. Forget to reset error state after successful retry
 * 10. Use different error handling patterns in different components
 */

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT WRAPPING PATTERNS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Pattern 1: Wrap AI Component with Both Error Boundaries
 * 
 * import AIErrorBoundary from '@/components/AIErrorBoundary';
 * import ErrorBoundary from '@/components/ErrorBoundary';
 * 
 * <ErrorBoundary>
 *   <AIErrorBoundary>
 *     <AIInsights />
 *   </AIErrorBoundary>
 * </ErrorBoundary>
 */

/**
 * Pattern 2: Wrap Only with AIErrorBoundary (for AI-specific components)
 * 
 * <AIErrorBoundary showHelp={true}>
 *   <GuidedJournal />
 * </AIErrorBoundary>
 */

/**
 * Pattern 3: Multiple AI Components in a Page
 * 
 * <ErrorBoundary>
 *   <AIErrorBoundary>
 *     <AIInsights />
 *   </AIErrorBoundary>
 *   
 *   <AIErrorBoundary>
 *     <GuidedTour />
 *   </AIErrorBoundary>
 * </ErrorBoundary>
 */

export default {
  ExampleSentimentComponent,
  ExampleTranscriptionComponent,
  exampleRetryWithBackoff,
  exampleSafeApiCall,
};
