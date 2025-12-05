import PropTypes from "prop-types";
import { AlertTriangle, WifiOff } from "lucide-react";
import RetryButton from "@/components/ui/RetryButton";
import NSButton from "@/components/ui/NSButton";

export default function ConnectionIssue({
  title = "Connection issue detected",
  subtitle = "We could not reach mission control.",
  details,
  status,
  onRetry,
  children,
  action,
  "data-testid": dataTestId = "connection-issue",
}) {
  const Icon = status === "offline" ? WifiOff : AlertTriangle;
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-[#050c1a] via-[#0f1b39] to-[#050c1a] px-6 py-16"
      data-testid={dataTestId}
    >
      <div className="max-w-2xl w-full bg-[#111a2f] border border-white/10 rounded-3xl shadow-2xl p-10 text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/40">
          <Icon className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <p className="uppercase tracking-[0.4em] text-white/40 text-xs mb-4">
            {status === "offline" ? "Offline" : "Connection"}
          </p>
          <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
          <p className="text-white/70 max-w-xl mx-auto">{subtitle}</p>
          {details && (
            <p
              className="text-white/50 text-sm mt-4"
              data-testid="connection-issue-details"
            >
              {details}
            </p>
          )}
        </div>

        {children}

        <div className="space-y-3">
          <RetryButton onRetry={onRetry} data-testid="connection-issue-retry" />
          <NSButton
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => window.location.assign("/status")}
          >
            View system status
          </NSButton>
        </div>

        {action}
      </div>
    </div>
  );
}

ConnectionIssue.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  details: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  status: PropTypes.oneOf(["offline", "error", "rate-limit", "unknown"]),
  onRetry: PropTypes.func,
  children: PropTypes.node,
  action: PropTypes.node,
  "data-testid": PropTypes.string,
};
