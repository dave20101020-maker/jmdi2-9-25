import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { getUserFriendlyMessage, getRecoverySuggestions } from '@/utils/errorHandling';

/**
 * ErrorAlert Component
 * 
 * Inline error display for async operations.
 * Shows error message with retry button and optional recovery suggestions.
 * 
 * @param {Object} props
 * @param {Object} props.error - Parsed error object from errorHandling.parseError()
 * @param {Function} props.onRetry - Callback when retry button clicked
 * @param {string} props.context - Optional context for error message (e.g., 'transcription')
 * @param {boolean} props.showSuggestions - Show recovery suggestions (default: true)
 * @param {Function} props.onDismiss - Callback when error dismissed
 * @param {string} props.size - 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} props.closeable - Show close button (default: true)
 */
export function ErrorAlert({
  error,
  onRetry,
  context = '',
  showSuggestions = true,
  onDismiss,
  size = 'md',
  closeable = true,
}) {
  if (!error) return null;

  const message = getUserFriendlyMessage(error, context);
  const suggestions = showSuggestions ? getRecoverySuggestions(error) : [];

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-6 text-base',
  };

  return (
    <div className={`rounded-lg border border-red-500/30 bg-red-500/10 ${sizeClasses[size]} my-4`}>
      <div className="flex gap-3">
        {/* Error Icon */}
        <AlertCircle className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Error Message */}
          <p className="text-red-700 dark:text-red-300 font-medium mb-2">{message}</p>

          {/* Recovery Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-3 text-xs text-red-600 dark:text-red-400">
              <p className="font-medium mb-1">Try:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {suggestions.slice(0, 2).map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {onRetry && error.isRetryable !== false && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-xs transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded font-medium text-xs transition-colors"
              >
                <X className="w-3 h-3" />
                Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        {closeable && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            aria-label="Dismiss error"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * LoadingState Component
 * 
 * Shows loading spinner with message
 */
export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="inline-block">
          <div className="animate-spin">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" className="opacity-25" />
              <path
                d="M4 12a8 8 0 018-8v0m0 16a8 8 0 01-8-8m16 0a8 8 0 01-8 8v0m0-16a8 8 0 018 8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * EmptyState Component
 * 
 * Shows empty state message when no data
 */
export function EmptyState({ 
  title = 'No data available',
  message = '',
  icon: Icon = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-12 h-12 text-gray-400 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {message && (
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">{message}</p>
      )}
    </div>
  );
}

/**
 * SuccessAlert Component
 * 
 * Shows success message
 */
export function SuccessAlert({ message, onDismiss, duration = 5000 }) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 my-4 flex items-center gap-3">
      <svg
        className="w-5 h-5 text-green-500 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-green-700 dark:text-green-300">{message}</p>
      {onDismiss && (
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="ml-auto text-green-600 hover:text-green-700"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default {
  ErrorAlert,
  LoadingState,
  EmptyState,
  SuccessAlert,
};
