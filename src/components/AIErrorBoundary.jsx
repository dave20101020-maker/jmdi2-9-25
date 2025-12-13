import { Component } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import {
  normalizeAiDiagnosticsFromError,
  renderAiDiagnosticLabel,
} from "@/ai/diagnostics";

const IS_DEV = import.meta.env.DEV;

/**
 * AIErrorBoundary Component
 *
 * Specialized error boundary for AI-related components.
 * Catches errors from AI API calls, provides recovery suggestions,
 * and offers fallback content for AI-powered features.
 *
 * Usage:
 * <AIErrorBoundary>
 *   <AIInsights />
 * </AIErrorBoundary>
 */
class AIErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: "unknown", // 'api', 'network', 'timeout', 'validation', 'unknown'
      errorCount: 0,
      isRecoverable: true,
      diagnostics: null,
    };
  }

  static getDerivedStateFromError(error) {
    const diagnostics = normalizeAiDiagnosticsFromError(error, "/api/ai");

    // Determine error type
    let errorType = "unknown";
    let isRecoverable = true;

    if (diagnostics.status === 0 && diagnostics.body === "timeout") {
      errorType = "timeout";
    } else if (
      diagnostics.status === 0 &&
      diagnostics.body === "network_error"
    ) {
      errorType = "network";
    } else if (typeof diagnostics.status === "number") {
      if (diagnostics.status === 400) {
        errorType = "validation";
      } else {
        errorType = "api";
      }
    }

    if (error.message?.includes("API")) {
      errorType = "api";
      isRecoverable = true;
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("fetch")
    ) {
      errorType = "network";
      isRecoverable = true;
    } else if (error.message?.includes("timeout")) {
      errorType = "timeout";
      isRecoverable = true;
    } else if (error.message?.includes("validation")) {
      errorType = "validation";
      isRecoverable = true;
    }

    return {
      hasError: true,
      error,
      errorType,
      isRecoverable,
      diagnostics,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console
    console.error("AIErrorBoundary caught:", error, errorInfo);

    // Update error count
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));

    // Send to analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ai_error", {
        error_type: this.state.errorType,
        error_message: error.toString(),
        component: errorInfo.componentStack,
        fatal: !this.state.isRecoverable,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: "unknown",
    });
  };

  handleRetry = () => {
    this.handleReset();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorType, isRecoverable, errorCount, diagnostics } =
        this.state;
      const normalizedLabel = diagnostics
        ? renderAiDiagnosticLabel(diagnostics)
        : null;

      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error,
          errorType,
          isRecoverable,
          retry: this.handleRetry,
          reset: this.handleReset,
        });
      }

      // Default fallback UI
      return (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-6 my-4">
          {/* Error Header */}
          <div className="flex items-start gap-4">
            {/* Error Icon */}
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
            </div>

            {/* Error Content */}
            <div className="flex-1 min-w-0">
              {/* Error Title */}
              <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
                {this.getErrorTitle(errorType)}
              </h3>

              {/* Error Description */}
              <p className="text-sm text-orange-600 dark:text-orange-300 mb-3">
                {normalizedLabel || this.getErrorMessage(errorType)}
              </p>

              {/* Development Error Details */}
              {IS_DEV && error && (
                <details className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                  <summary className="cursor-pointer font-mono hover:text-orange-700">
                    Technical Details
                  </summary>
                  <pre className="mt-2 bg-black/20 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                    {error.toString()}
                  </pre>
                </details>
              )}

              {/* Multiple Errors Warning */}
              {errorCount > 2 && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-600 dark:text-red-400 text-xs">
                  ⚠️ Multiple errors detected ({errorCount}). Please refresh the
                  page if issues persist.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {isRecoverable && (
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-medium text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}

                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 rounded font-medium text-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-orange-500/50 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 rounded font-medium text-sm transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </a>
              </div>
            </div>
          </div>

          {/* Help Section */}
          {this.props.showHelp !== false && (
            <div className="mt-4 pt-4 border-t border-orange-500/20 text-xs text-orange-600 dark:text-orange-400">
              <p className="font-medium mb-1">💡 Troubleshooting Tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                {errorType === "network" && (
                  <>
                    <li>Check your internet connection</li>
                    <li>Try refreshing the page</li>
                    <li>Wait a moment and try again</li>
                  </>
                )}
                {errorType === "timeout" && (
                  <>
                    <li>The AI service is taking longer than usual</li>
                    <li>Please try again in a moment</li>
                    <li>Consider simplifying your request</li>
                  </>
                )}
                {errorType === "api" && (
                  <>
                    <li>The AI service is temporarily unavailable</li>
                    <li>Please try again later</li>
                    <li>Contact support if the problem persists</li>
                  </>
                )}
                {errorType === "unknown" && (
                  <>
                    <li>Try refreshing the page</li>
                    <li>Clear your browser cache</li>
                    <li>Try again in a moment</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }

  getErrorTitle(errorType) {
    const titles = {
      api: "🤖 AI Service Unavailable",
      network: "🌐 Connection Error",
      timeout: "⏱️ Request Timeout",
      validation: "⚠️ Invalid Input",
      unknown: "⚠️ Something Went Wrong",
    };
    return titles[errorType] || titles.unknown;
  }

  getErrorMessage(errorType) {
    const messages = {
      api: "The AI service is temporarily unavailable. This might be a temporary issue. Please try again in a moment.",
      network:
        "Unable to connect to the server. Please check your internet connection and try again.",
      timeout:
        "The request took too long to complete. Please try again, or try a simpler request.",
      validation:
        "Your input could not be processed. Please check the format and try again.",
      unknown:
        "An unexpected error occurred. Please try again or contact support if the problem persists.",
    };
    return messages[errorType] || messages.unknown;
  }
}

export default AIErrorBoundary;
