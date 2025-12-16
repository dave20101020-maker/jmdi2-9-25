import { Component } from "react";
import PropTypes from "prop-types";
import ConnectionIssue from "@/components/fallbacks/ConnectionIssue";
import RetryButton from "@/components/ui/RetryButton";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";

export default class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      offline:
        typeof navigator !== "undefined" ? navigator.onLine === false : false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[GlobalErrorBoundary]", error, info);

    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent("northstar:error", { detail: { error, info } })
        );
      } catch (evtError) {
        console.warn("[GlobalErrorBoundary] event dispatch failed", evtError);
      }

      if (window.Sentry?.captureException) {
        window.Sentry.captureException(error, {
          contexts: { react: { componentStack: info?.componentStack } },
        });
      }
    }

    this.setState({ errorInfo: info });
  }

  componentDidMount() {
    if (typeof window === "undefined") return;
    window.addEventListener("online", this.handleOnlineStatus);
    window.addEventListener("offline", this.handleOfflineStatus);
  }

  componentWillUnmount() {
    if (typeof window === "undefined") return;
    window.removeEventListener("online", this.handleOnlineStatus);
    window.removeEventListener("offline", this.handleOfflineStatus);
  }

  handleOnlineStatus = () => {
    this.setState({ offline: false });
  };

  handleOfflineStatus = () => {
    this.setState({ offline: true });
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleRetry = () => {
    if (this.state.offline) {
      window.location.reload();
      return;
    }
    this.handleReset();
  };

  renderFallback() {
    const { fallback } = this.props;
    const { offline, error, errorInfo } = this.state;

    const safeMessage =
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : "The interface encountered an unexpected error. Retry the action or refresh the page to continue.";

    const safeDetails = error
      ? typeof error === "string"
        ? error
        : normalizeErrorMessage(error, "(no details)")
      : "";

    if (offline) {
      return (
        <ConnectionIssue
          status="offline"
          title="Connection lost"
          subtitle="We cannot reach NorthStar mission control right now."
          details="Reconnect to a stable network or switch to a trusted connection."
          onRetry={this.handleRetry}
        />
      );
    }

    if (fallback) {
      return fallback({
        error,
        errorInfo,
        resetError: this.handleReset,
      });
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050b18] px-6 py-16">
        <div className="max-w-2xl w-full bg-[#101c32] border border-white/10 rounded-3xl shadow-2xl p-10 text-center space-y-6">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="text-sm tracking-[0.4em] uppercase text-white/40">
              Runtime Issue
            </div>
            <h1 className="text-3xl font-bold text-white">
              Something disrupted this mission
            </h1>
            <p className="text-white/70">{safeMessage}</p>
          </div>
          <RetryButton onRetry={this.handleRetry} />
          <div className="text-left text-white/40 text-xs font-mono bg-black/40 rounded-2xl p-4 max-h-60 overflow-auto">
            {error && (
              <p className="mb-2">
                <strong>Error:</strong> {safeDetails}
              </p>
            )}
            {errorInfo?.componentStack && <pre>{errorInfo.componentStack}</pre>}
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError || this.state.offline) {
      return this.renderFallback();
    }
    return this.props.children;
  }
}

GlobalErrorBoundary.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.func,
  onReset: PropTypes.func,
};
