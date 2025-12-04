import { Component } from "react";

const IS_DEV = import.meta.env.DEV;

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Send to error reporting service (e.g., Sentry)
    if (typeof window !== "undefined" && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    // Log to analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI can be passed as a prop
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset,
        });
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A1628] to-[#1a1f35] px-4">
          <div className="max-w-2xl w-full bg-[#1a1f35] border border-white/20 rounded-2xl p-8 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-white/70 mb-8">
              We encountered an unexpected error. Don't worry, your data is
              safe. Try refreshing the page or contact support if the problem
              persists.
            </p>

            {/* Error Details (Development Only) */}
            {IS_DEV && this.state.error && (
              <div className="mb-8 text-left bg-black/30 rounded-lg p-4 overflow-auto max-h-64">
                <p className="text-red-400 font-mono text-sm mb-2">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-white/60 font-mono text-xs">
                    <summary className="cursor-pointer hover:text-white mb-2">
                      Component Stack
                    </summary>
                    <pre className="whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Error Count Warning */}
            {this.state.errorCount > 2 && (
              <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                <p className="text-orange-400 text-sm">
                  ⚠️ Multiple errors detected ({this.state.errorCount}).
                  Consider reloading the page.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] rounded-xl text-[#0A1628] font-bold hover:shadow-lg transition-all"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-[#1a1f35] border border-white/20 rounded-xl text-white font-bold hover:bg-white/5 transition-all"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="px-6 py-3 bg-[#1a1f35] border border-white/20 rounded-xl text-white font-bold hover:bg-white/5 transition-all inline-flex items-center justify-center"
              >
                Go to Dashboard
              </a>
            </div>

            {/* Support Link */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/50 text-sm">
                Need help?{" "}
                <a
                  href="/support"
                  className="text-[#D4AF37] hover:text-[#F4D03F] underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Usage Examples:
 *
 * 1. Basic usage:
 *
 * import ErrorBoundary from '@/components/ErrorBoundary';
 *
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <Router />
 *     </ErrorBoundary>
 *   );
 * }
 *
 *
 * 2. With custom fallback:
 *
 * <ErrorBoundary
 *   fallback={({ error, resetError }) => (
 *     <div>
 *       <h1>Custom Error UI</h1>
 *       <p>{error.message}</p>
 *       <button onClick={resetError}>Reset</button>
 *     </div>
 *   )}
 * >
 *   <YourApp />
 * </ErrorBoundary>
 *
 *
 * 3. Multiple boundaries for different sections:
 *
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <Header />
 *       <ErrorBoundary>
 *         <Sidebar />
 *       </ErrorBoundary>
 *       <ErrorBoundary>
 *         <MainContent />
 *       </ErrorBoundary>
 *     </ErrorBoundary>
 *   );
 * }
 *
 *
 * 4. With error reporting service (Sentry):
 *
 * // In your index.html or main entry point:
 * <script src="https://browser.sentry-cdn.com/..."></script>
 * <script>
 *   Sentry.init({
 *     dsn: "your-dsn-here",
 *     environment: "production"
 *   });
 * </script>
 *
 * // ErrorBoundary automatically sends errors to Sentry
 */
