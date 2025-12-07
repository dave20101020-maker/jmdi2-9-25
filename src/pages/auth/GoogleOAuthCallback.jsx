import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/Layout/AuthLayout";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";
import { consumeGoogleOAuthState } from "@/lib/oauth/google";
import { toast } from "sonner";

const DEFAULT_STATUS = {
  type: "loading",
  message: "Finalizing Google authentication...",
};

const decodeParam = (value) => {
  if (!value) return "";
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch (error) {
    return value;
  }
};

export default function GoogleOAuthCallback() {
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
            "Google denied the authentication request. Please try again.",
        });
        return;
      }

      const expectedState = consumeGoogleOAuthState();
      if (expectedState && returnedState && expectedState !== returnedState) {
        setStatus({
          type: "error",
          message: "Security check failed. Please restart Google sign-in.",
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
          toast.success("Google sign-in complete", {
            description,
          });
          if (mounted) {
            navigate("/dashboard", { replace: true });
          }
          return;
        }
        setStatus({
          type: "error",
          message: "We could not load your profile after Google sign-in.",
        });
      } catch (error) {
        setStatus({
          type: "error",
          message:
            error?.message ||
            "Something went wrong while finalizing Google sign-in.",
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
          "Google sign-in failed. Please try again.",
      });
    }

    return () => {
      mounted = false;
    };
  }, [navigate, refreshUser, searchParams]);

  return (
    <AuthLayout
      eyebrow="Google Authentication"
      title={
        status.type === "error"
          ? "We couldn't finalize your sign-in"
          : "Securing your cockpit"
      }
      subtitle={
        status.type === "error"
          ? status.message
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
              {status.message}
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
              {status.message}
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
