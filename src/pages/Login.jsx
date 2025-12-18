import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Chrome, Facebook, Lock, Mail } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import AuthLayout from "@/components/Layout/AuthLayout";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import FacebookSignInButton from "@/components/auth/FacebookSignInButton";
import { AUTH_MODE } from "@/config/authMode";

const INITIAL_FORM = { email: "", password: "" };

export default function Login() {
  if (AUTH_MODE === "PARKED") {
    return <Navigate to="/dashboard" replace />;
  }

  const { user, isAuthenticated, initializing } = useAuth();
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!initializing && isAuthenticated && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [initializing, isAuthenticated, user, navigate]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    void loginWithRedirect();
  };

  const handleGoogleStart = () => {
    setFormError("");
  };

  const handleGoogleError = (error) => {
    const message =
      error?.message || "We could not start Google authentication.";
    setFormError(message);
    toast.error("Google sign-in failed", { description: message });
  };

  const handleGoogleClick = async () => {
    handleGoogleStart();
    try {
      await loginWithRedirect({
        authorizationParams: { connection: "google-oauth2" },
      });
    } catch (error) {
      handleGoogleError(error);
    }
  };

  const handleFacebookStart = () => {
    setFormError("");
  };

  const handleFacebookError = (error) => {
    const message =
      error?.message || "We could not start Facebook authentication.";
    setFormError(message);
    toast.error("Facebook sign-in failed", { description: message });
  };

  return (
    <AuthLayout
      eyebrow="NorthStar Access"
      title="Command Center Login"
      subtitle="Authenticate to sync your personalized dashboards, copilots, and rituals."
      footer={
        <>
          Need an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      <div className="ns-auth-stack" data-testid="login-screen">
        {formError && (
          <div
            className="ns-alert"
            role="alert"
            aria-live="polite"
            data-testid="login-error"
          >
            {formError}
          </div>
        )}

        <div className="text-white/70 text-sm" aria-live="polite">
          Email/password login is handled by Auth0
        </div>

        <form
          className="ns-auth-form"
          onSubmit={handleSubmit}
          data-testid="login-form"
        >
          <NSInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="pilot@northstar.app"
            value={form.email}
            onChange={handleChange("email")}
            disabled
            variant="contrast"
            leftIcon={<Mail className="w-4 h-4" />}
            error={fieldErrors.email}
            data-testid="login-email-input"
          />
          <NSInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your access key"
            value={form.password}
            onChange={handleChange("password")}
            disabled
            variant="contrast"
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.password}
            data-testid="login-password-input"
          />
          <NSButton
            type="submit"
            className="w-full"
            data-testid="login-submit-button"
          >
            Sign in
          </NSButton>
        </form>

        <div className="ns-auth-divider">
          <span>or</span>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <NSButton
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            className="ns-google-button"
            onClick={handleGoogleClick}
            leadingIcon={<Chrome className="w-4 h-4" />}
            data-testid="login-google-button"
          >
            Continue with Google
          </NSButton>
          <FacebookSignInButton
            fullWidth
            onStart={handleFacebookStart}
            onError={handleFacebookError}
            data-testid="login-facebook-button"
          />
        </div>
      </div>
    </AuthLayout>
  );
}
