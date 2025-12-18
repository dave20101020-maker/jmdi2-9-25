import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/Layout/AuthLayout";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";
import { consumeFacebookOAuthState } from "@/lib/oauth/facebook";
import { toast } from "sonner";
import { AUTH_MODE } from "@/config/authMode";

const DEFAULT_STATUS = {
  type: "loading",
  message: "Finalizing Facebook authentication...",
};

const decodeParam = (value) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch (error) {
    return value;
  }
};

export default function FacebookOAuthCallback() {
  if (AUTH_MODE === "PARKED") {
    return <Navigate to="/dashboard" replace />;
  }

  return <FacebookOAuthCallbackInner />;
}

function FacebookOAuthCallbackInner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState(DEFAULT_STATUS);

  useEffect(() => {
    let mounted = true;
    const statusParam = searchParams.get("status");
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const returnedState = searchParams.get("state");

    const finalize = async () => {
      if (errorParam) {
        const message =
          decodeParam(errorDescription) || decodeParam(errorParam);
        setStatus({
          type: "error",
          message:
            message ||
            "Facebook denied the authentication request. Please try again.",
        });
        return;
      }

      const expectedState = consumeFacebookOAuthState();
      if (expectedState && returnedState && expectedState !== returnedState) {
        setStatus({
          type: "error",
          message: "Security check failed. Please restart Facebook sign-in.",
        });
        return;
      }

      setStatus(DEFAULT_STATUS);
      try {
        const sessionUser = await refreshUser();
        if (sessionUser) {
          const description =
            (sessionUser && (sessionUser.name || sessionUser.email)) ||
            "Welcome back";
          toast.success("Facebook sign-in complete", {
            description,
          });
          if (mounted) {
            navigate("/dashboard", { replace: true });
          }
          return;
        }
        setStatus({
          type: "error",
          message: "We could not load your profile after Facebook sign-in.",
        });
      } catch (error) {
        setStatus({
          type: "error",
          message:
            error?.message ||
            "Something went wrong while finalizing Facebook sign-in.",
        });
      }
    };

    if (statusParam === "success" || !errorParam) {
      finalize();
    } else {
      setStatus({
        type: "error",
        message:
          decodeParam(errorDescription) ||
          "Facebook sign-in failed. Please try again.",
      });
    }

    return () => {
      mounted = false;
    };
  }, [navigate, refreshUser, searchParams]);

  return (
    <AuthLayout
      eyebrow="Facebook Authentication"
      title={
        status.type === "error"
          ? "We couldn't finalize your sign-in"
          : "Securing your cockpit"
      }
      subtitle={
        status.type === "error"
          ? normalizeErrorMessage(status.message, "OAuth sign-in failed")
          : "Hold tight while we finish syncing your profile."
      }
      aside={
        <div className="ns-auth-aside">
          <p className="ns-auth-aside__label">Security protocol</p>
          <div className="ns-auth-aside__callout">
            <span className="ns-auth-aside__icon" aria-hidden="true">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <p className="ns-auth-aside__title">Encrypted session</p>
              <p className="ns-auth-aside__text">
                We encrypt every session to keep your rituals and insights
                private.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <div className="ns-auth-stack" role="status" aria-live="polite">
        {status.type === "error" ? (
          <>
            <div className="ns-alert" role="alert">
              {normalizeErrorMessage(status.message, "OAuth sign-in failed")}
            </div>
            <NSButton size="lg" fullWidth onClick={() => navigate("/login")}>
              Return to login
            </NSButton>
            <p className="text-center text-sm text-white/70">
              Need help? <Link to="/support">Contact support</Link>
            </p>
          </>
        ) : (
          <>
            <div className="ns-alert ns-alert--info" role="status">
              {normalizeErrorMessage(status.message, "Completing sign-in…")}
            </div>
            <p className="text-sm text-white/70 text-center">
              This usually takes just a moment.
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
