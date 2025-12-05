import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail, Shield, Sparkles } from "lucide-react";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import AuthLayout from "@/components/Layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ERROR_MESSAGES = {
  "auth/invalid-credential": "Those credentials did not match our records.",
  "auth/user-not-found": "No account found for that email.",
  "auth/wrong-password": "Incorrect password. Try again or reset it.",
  "auth/too-many-requests": "Too many attempts. Please try again in a moment.",
};

const FIELD_ERROR_TARGETS = {
  "auth/invalid-email": "email",
  "auth/invalid-credential": "email",
  "auth/user-not-found": "email",
  "auth/wrong-password": "password",
  "auth/missing-password": "password",
};

const createFieldErrors = () => ({ email: "", password: "" });
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const INITIAL_STATUS = { type: null, message: "" };

const IS_DEV = import.meta.env.DEV;

function getErrorMessage(error) {
  if (!error) return "";
  if (ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  return "We could not sign you in. Please try again.";
}

function isAuthError(error) {
  if (!error) return false;
  const status =
    error.status || error.statusCode || error?.response?.status || null;
  if (typeof status === "number" && [400, 401, 403].includes(status)) {
    return true;
  }
  if (typeof error.code === "string") {
    return error.code.startsWith("auth/");
  }
  if (typeof error === "string") {
    return true;
  }
  return false;
}

function logAuthDebug(label, payload) {
  if (!IS_DEV) return;
  console.log(`[SignIn] ${label}`, payload);
}

const getGoogleErrorDescription = (error) => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "this domain";
  switch (error?.code) {
    case "auth/unauthorized-domain":
      return `Google Sign-In is not allowed from ${origin}. Add this origin under Firebase Authentication → Settings → Authorized domains.`;
    case "auth/popup-blocked":
      return "Your browser blocked the Google popup. Please enable popups for this site and try again.";
    case "auth/popup-closed-by-user":
      return "The Google popup closed before sign-in completed. Please try again.";
    default:
      return (
        getErrorMessage(error) ||
        "We could not complete Google sign in. Try again."
      );
  }
};

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    signInWithEmail,
    signInWithGoogle,
    loading: authLoading,
  } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [fieldErrors, setFieldErrors] = useState(createFieldErrors);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

  const clearStatus = useCallback(() => setStatus(INITIAL_STATUS), []);
  const exitLoadingStatus = useCallback(
    () =>
      setStatus((prev) => (prev.type === "loading" ? INITIAL_STATUS : prev)),
    []
  );

  const redirectCandidate = location.state?.from?.pathname;
  const redirectPath =
    redirectCandidate && redirectCandidate !== "/sign-in"
      ? redirectCandidate
      : "/dashboard";
  const benefits = useMemo(
    () => [
      {
        label: "Encrypted mission control",
        icon: <Shield className="w-4 h-4" />,
      },
      {
        label: "AI copilots on standby",
        icon: <Sparkles className="w-4 h-4" />,
      },
    ],
    []
  );

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate, redirectPath]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (status.type && status.type !== "loading") {
      clearStatus();
    }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearStatus();
    setFieldErrors(createFieldErrors());
    const validationErrors = {};
    const trimmedEmail = form.email.trim();
    const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
    const isPasswordValid = form.password.length >= MIN_PASSWORD_LENGTH;
    if (!isEmailValid) {
      validationErrors.email = "Enter a valid email address.";
    }
    if (!isPasswordValid) {
      validationErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...validationErrors }));
      const validationMessage = "Please fix the highlighted fields.";
      setStatus({
        type: "error",
        message: validationMessage,
      });
      toast.error("Sign-in validation failed", {
        description: validationMessage,
      });
      return;
    }
    setFormSubmitting(true);
    setStatus({ type: "loading", message: "Signing you in..." });
    const requestBody = { email: form.email };
    logAuthDebug("sign-in request", { body: requestBody });
    try {
      const sessionUser = await signInWithEmail(form.email, form.password);
      logAuthDebug("sign-in response", {
        status: 200,
        uid: sessionUser?.uid || null,
      });
      setStatus({
        type: "success",
        message: "Authenticated. Redirecting to your dashboard...",
      });
      toast.success("Welcome back", {
        description: "Redirecting you to mission control.",
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      logAuthDebug("sign-in error", {
        status: err?.status || err?.code || "unknown",
        message: err?.message,
        json: err?.response || null,
      });
      if (isAuthError(err)) {
        const presentable = getErrorMessage(err);
        setStatus({ type: "error", message: presentable });
        toast.error("Sign-in failed", { description: presentable });
        const fieldKey = FIELD_ERROR_TARGETS[err.code];
        if (fieldKey) {
          setFieldErrors((prev) => ({ ...prev, [fieldKey]: presentable }));
        }
      } else {
        const fallbackMessage =
          "We could not sign you in. Please try again in a moment.";
        setStatus({
          type: "error",
          message: fallbackMessage,
        });
        toast.error("Sign-in failed", { description: fallbackMessage });
      }
    } finally {
      setFormSubmitting(false);
      exitLoadingStatus();
    }
  };

  const handleGoogle = async () => {
    clearStatus();
    setOauthSubmitting(true);
    setStatus({ type: "loading", message: "Contacting Google..." });
    logAuthDebug("google sign-in request", { provider: "google" });
    try {
      const profile = await signInWithGoogle();
      logAuthDebug("google sign-in response", {
        status: 200,
        json: profile,
      });
      toast.success("Signed in with Google", {
        description:
          profile?.fullName ||
          profile?.displayName ||
          profile?.email ||
          "Welcome back to NorthStar.",
      });
      setStatus({
        type: "success",
        message: "Google authentication complete. Redirecting...",
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      logAuthDebug("google sign-in error", {
        status: err?.status || err?.code || "unknown",
        message: err?.message,
      });
      const googleMessage = getGoogleErrorDescription(err);
      setStatus({ type: "error", message: googleMessage });
      toast.error("Google sign-in failed", {
        description: googleMessage,
      });
    } finally {
      setOauthSubmitting(false);
      exitLoadingStatus();
    }
  };

  if (authLoading) {
    return (
      <AuthLayout
        eyebrow="Initializing"
        title="Checking your credentials..."
        subtitle="Hold tight while we sync with mission control."
      >
        <div className="ns-auth-stack" role="status" aria-live="polite">
          <p className="text-sm text-white/70">
            Hold tight while we sync with mission control.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const trimmedEmail = form.email.trim();
  const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
  const isPasswordValid = form.password.length >= MIN_PASSWORD_LENGTH;
  const isFormValid = isEmailValid && isPasswordValid;
  const isBusy = formSubmitting || oauthSubmitting;

  const missionAside = (
    <div className="ns-auth-aside">
      <p className="ns-auth-aside__label">Mission perks</p>
      <ul className="ns-auth-aside__list">
        {benefits.map(({ label, icon }) => (
          <li key={label} className="ns-auth-aside__item">
            <span className="ns-auth-aside__icon" aria-hidden="true">
              {icon}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AuthLayout
      eyebrow="NorthStar Access"
      title="Command Center Login"
      subtitle="Authenticate to sync your personalized dashboards, AI copilots, and habit loops."
      aside={missionAside}
      footer={
        <>
          New here? <Link to="/sign-up">Create an account</Link>
        </>
      }
    >
      <div className="ns-auth-stack">
        {status.type === "error" && (
          <div className="ns-alert" role="alert">
            {status.message}
          </div>
        )}
        {status.type === "success" && (
          <div className="ns-alert ns-alert--success" role="status">
            {status.message}
          </div>
        )}

        <form className="ns-auth-form" onSubmit={handleSubmit}>
          <NSInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            leftIcon={<Mail size={16} />}
            placeholder="commander@northstar.app"
            value={form.email}
            onChange={handleChange("email")}
            required
            variant="contrast"
            error={fieldErrors.email}
          />
          <NSInput
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your access key"
            leftIcon={<Lock size={16} />}
            value={form.password}
            onChange={handleChange("password")}
            required
            variant="contrast"
            error={fieldErrors.password}
          />

          <div className="ns-auth-actions">
            <label className="ns-checkbox">
              <input type="checkbox" name="remember" defaultChecked />
              <span>Remember device</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <NSButton
            type="submit"
            disabled={!isFormValid || isBusy}
            loading={formSubmitting}
            size="lg"
            fullWidth
          >
            Sign in
          </NSButton>
        </form>

        <div className="ns-auth-divider">
          <span>or</span>
        </div>

        <NSButton
          type="button"
          variant="outline"
          className="ns-google-button"
          size="lg"
          fullWidth
          onClick={handleGoogle}
          disabled={isBusy}
          loading={oauthSubmitting}
          leadingIcon={<Chrome className="w-4 h-4" />}
        >
          Continue with Google
        </NSButton>
      </div>
    </AuthLayout>
  );
}
