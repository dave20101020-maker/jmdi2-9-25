/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Error Handling Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Standardized error handling for frontend API calls.
 * - Parse backend error responses
 * - Generate user-friendly messages
 * - Handle different error types (network, timeout, validation, API)
 * - Provide retry logic and recovery suggestions
 */

/**
 * Parse error response from backend
 * Backend uses: { error: true, message, code? }
 * 
 * @param {Error|any} error - Error object from try/catch or response
 * @returns {Object} Standardized error object
 */
export function parseError(error) {
  // Handle null/undefined
  if (!error) {
    return {
      type: 'unknown',
      message: 'An unknown error occurred',
      code: undefined,
      isUserError: false,
      isRetryable: true,
    };
  }

  // Handle backend error response (from axios/fetch)
  if (error.response?.data?.error) {
    const data = error.response.data;
    return {
      type: 'api',
      message: data.message || 'API error occurred',
      code: error.response.status,
      isUserError: error.response.status >= 400 && error.response.status < 500,
      isRetryable: error.response.status >= 500 || error.response.status === 429,
    };
  }

  // Handle network error
  if (error.message?.includes('network') || error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
    return {
      type: 'network',
      message: 'Unable to connect to server. Please check your internet connection.',
      code: error.code,
      isUserError: false,
      isRetryable: true,
    };
  }

  // Handle timeout
  if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
    return {
      type: 'timeout',
      message: 'Request took too long. Please try again.',
      code: error.code,
      isUserError: false,
      isRetryable: true,
    };
  }

  // Handle validation error
  if (error.message?.includes('validation') || error.name === 'ValidationError') {
    return {
      type: 'validation',
      message: error.message || 'Invalid input. Please check your data.',
      code: 'VALIDATION_ERROR',
      isUserError: true,
      isRetryable: false,
    };
  }

  // Handle generic JavaScript error
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
      code: error.code,
      isUserError: false,
      isRetryable: true,
    };
  }

  // Fallback for anything else
  return {
    type: 'unknown',
    message: String(error),
    code: undefined,
    isUserError: false,
    isRetryable: true,
  };
}

/**
 * Get user-friendly error message
 * Different wording based on error type and context
 * 
 * @param {Object} error - Parsed error from parseError()
 * @param {string} context - Optional context (e.g., 'transcription', 'sentiment')
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(error, context = '') {
  const contextPrefix = context ? `${context}: ` : '';

  const messages = {
    network: `${contextPrefix}Unable to connect. Please check your internet connection and try again.`,
    timeout: `${contextPrefix}The request took too long. Please try again with a shorter input.`,
    api: error.isUserError
      ? `${contextPrefix}Invalid input. Please check your data and try again.`
      : `${contextPrefix}The server is temporarily unavailable. Please try again in a moment.`,
    validation: `${contextPrefix}${error.message || 'Invalid input. Please check your data.'}`,
    unknown: `${contextPrefix}An unexpected error occurred. Please try again or contact support.`,
  };

  return messages[error.type] || messages.unknown;
}

/**
 * Get suggestions for fixing an error
 * 
 * @param {Object} error - Parsed error from parseError()
 * @returns {string[]} Array of suggestion strings
 */
export function getRecoverySuggestions(error) {
  const suggestions = {
    network: [
      'Check your internet connection',
      'Try moving closer to your Wi-Fi router',
      'Disable VPN if you\'re using one',
      'Refresh the page and try again',
    ],
    timeout: [
      'Try again with a shorter or simpler request',
      'Wait a moment and try again',
      'The AI service might be busy, try again later',
    ],
    api: error.code >= 500
      ? [
          'The server is temporarily overloaded',
          'Please try again in a few moments',
          'Contact support if the problem persists',
        ]
      : [
          'Check your input for any errors',
          'Make sure your data is in the correct format',
          'Try simplifying your request',
        ],
    validation: [
      'Check the format of your input',
      'Make sure all required fields are filled',
      'Try removing special characters',
    ],
    unknown: [
      'Refresh the page and try again',
      'Clear your browser cache and cookies',
      'Try again in a moment',
      'Contact support if the problem persists',
    ],
  };

  return suggestions[error.type] || suggestions.unknown;
}

/**
 * Hook for handling async operations with error handling
 * Used in functional components for managing loading/error states
 * 
 * @example
 * const { state, execute, reset } = useAsync();
 * 
 * const handleClick = () => {
 *   execute(async () => {
 *     return await fetch('/api/data');
 *   });
 * };
 * 
 * return (
 *   <>
 *     {state.loading && <Spinner />}
 *     {state.error && <ErrorAlert error={state.error} onRetry={handleClick} />}
 *     {state.success && <SuccessMessage />}
 *   </>
 * );
 */
export function useAsync(initialState = {}) {
  const [state, setState] = React.useState({
    loading: false,
    error: null,
    success: false,
    data: null,
    ...initialState,
  });

  const execute = React.useCallback(async (fn) => {
    setState({
      loading: true,
      error: null,
      success: false,
      data: null,
    });

    try {
      const result = await fn();
      setState({
        loading: false,
        error: null,
        success: true,
        data: result,
      });
      return result;
    } catch (error) {
      const parsedError = parseError(error);
      setState({
        loading: false,
        error: parsedError,
        success: false,
        data: null,
      });
      throw parsedError;
    }
  }, []);

  const reset = React.useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false,
      data: null,
    });
  }, []);

  const retry = React.useCallback(
    async (fn) => execute(fn),
    [execute]
  );

  return {
    state,
    execute,
    reset,
    retry,
  };
}

/**
 * Retry with exponential backoff
 * 
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise} Result of successful execution
 */
export async function retryWithBackoff(
  fn,
  maxRetries = 3,
  initialDelay = 1000
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const parsedError = parseError(error);
      if (!parsedError.isRetryable) {
        throw error;
      }

      // Calculate delay with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        // Add jitter to avoid thundering herd
        const jitter = Math.random() * delay * 0.1;
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      }
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable
 * 
 * @param {Error|Object} error - Error object
 * @returns {boolean} True if error is retryable
 */
export function isRetryable(error) {
  const parsed = parseError(error);
  return parsed.isRetryable;
}

/**
 * Create a safe async wrapper for API calls
 * Automatically handles errors and provides fallback
 * 
 * @example
 * const result = await safeApiCall(
 *   () => api.getInsights(),
 *   { fallback: [], context: 'loading insights' }
 * );
 */
export async function safeApiCall(
  fn,
  {
    fallback = null,
    context = '',
    onError = null,
    onRetry = null,
    shouldRetry = true,
    maxRetries = 2,
  } = {}
) {
  try {
    if (shouldRetry && maxRetries > 0) {
      return await retryWithBackoff(fn, maxRetries);
    }
    return await fn();
  } catch (error) {
    const parsedError = parseError(error);
    const message = getUserFriendlyMessage(parsedError, context);

    console.error(`API Error (${context}):`, {
      error: parsedError,
      message,
    });

    if (onError) {
      onError(parsedError, message);
    }

    // Return fallback value instead of throwing
    return fallback;
  }
}

// Re-export React for useAsync hook
import React from 'react';

export default {
  parseError,
  getUserFriendlyMessage,
  getRecoverySuggestions,
  useAsync,
  retryWithBackoff,
  isRetryable,
  safeApiCall,
};
