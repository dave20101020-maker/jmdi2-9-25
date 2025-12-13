import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail, Shield, Sparkles } from "lucide-react";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import AuthLayout from "@/components/Layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STATUS_MESSAGES = {
  400: "Please double-check your email and password.",
  401: "Those credentials did not match our records.",
  403: "Your account is temporarily locked. Contact support if this continues.",
};

const STATUS_FIELD_TARGETS = {
  400: "email",
  401: "password",
  403: "email",
};

const DEFAULT_LOGIN_ERROR =
  "We couldn't verify those credentials. Please try again.";

const DEFAULT_GOOGLE_ERROR =
  "We couldn't complete Google sign in. Try again in a moment.";

const createFieldErrors = () => ({ email: "", password: "" });
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const INITIAL_STATUS = { type: null, message: "" };

const IS_DEV = import.meta.env.DEV;

function getErrorMessage(error) {
  if (!error) return DEFAULT_LOGIN_ERROR;
  const serverMessage =
    error?.body?.error ||
    error?.body?.message ||
    error?.message ||
    error?.response?.data?.error;
  if (serverMessage) return serverMessage;
  const status = error?.status || error?.statusCode || error?.response?.status;
  if (status && STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }
  return DEFAULT_LOGIN_ERROR;
}

function isAuthError(error) {
  if (!error) return false;
  const status = error?.status || error?.statusCode || error?.response?.status;
  return typeof status === "number" && status >= 400 && status < 500;
}

function logAuthDebug(label, payload) {
  if (!IS_DEV) return;
  console.log(`[SignIn] ${label}`, payload);
}

const getGoogleErrorDescription = (error) => {
  return getErrorMessage(error) || DEFAULT_GOOGLE_ERROR;
};

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signInWithGoogle, initializing } = useAuth();
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
    redirectCandidate && redirectCandidate !== "/login"
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
      const sessionUser = await signIn(form.email, form.password);
      logAuthDebug("sign-in response", {
        status: 200,
        userId:
          sessionUser?._id || sessionUser?.id || sessionUser?.email || null,
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
        const status = err?.status || err?.statusCode || err?.response?.status;
        const fieldKey = status ? STATUS_FIELD_TARGETS[status] : null;
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
    setStatus({ type: "loading", message: "Redirecting to Google..." });
    logAuthDebug("google sign-in request", { provider: "google" });
    try {
      await signInWithGoogle({ redirectPath });
      logAuthDebug("google sign-in redirect", { status: 200 });
      toast.success("Opening Google", {
        description: "Complete the Google prompt to finish signing in.",
      });
      setStatus({
        type: "success",
        message: "Google authentication flow in progress...",
      });
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

  const DEMO_MODE =
    (import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";
  const DEMO_INIT_TIMEOUT_MS = Number(
    import.meta.env.VITE_DEMO_INIT_TIMEOUT_MS || 3000
  );

  const [initExpired, setInitExpired] = useState(false);
  useEffect(() => {
    if (!initializing) return;
    if (!DEMO_MODE && !(import.meta.env.VITE_DISABLE_PROTECTION === "true"))
      return;
    const t = setTimeout(() => setInitExpired(true), DEMO_INIT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [initializing, DEMO_MODE, DEMO_INIT_TIMEOUT_MS]);

  if (initializing && !initExpired) {
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
          New here? <Link to="/register">Create an account</Link>
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
