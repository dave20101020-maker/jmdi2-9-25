import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail, Shield, Sparkles } from "lucide-react";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import AuthLayout from "@/components/Layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";
import Auth0LoginButton from "@/components/auth/Auth0LoginButton";
import { useAuth0 } from "@auth0/auth0-react";

const createFieldErrors = () => ({ email: "", password: "" });
const INITIAL_STATUS = { type: null, message: "" };

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, initializing } = useAuth();
  const { loginWithRedirect } = useAuth0();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [fieldErrors, setFieldErrors] = useState(createFieldErrors);

  const clearStatus = useCallback(() => setStatus(INITIAL_STATUS), []);
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
    if (isAuthenticated && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectPath]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (status.type && status.type !== "loading") {
      clearStatus();
    }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearStatus();
    setFieldErrors(createFieldErrors());
    void loginWithRedirect();
  };

  const handleGoogle = () => {
    clearStatus();
    void loginWithRedirect({
      authorizationParams: { connection: "google-oauth2" },
    });
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

  // /login must always render the login UI even if auth context is still
  // initializing (e.g., when AuthProvider is not mounted).
  const isBusy = Boolean(initializing && !initExpired);

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
        <div className="text-white/70 text-sm" aria-live="polite">
          Email/password login is handled by Auth0
        </div>

        {status.type === "error" && (
          <div className="ns-alert" role="alert">
            {normalizeErrorMessage(status.message, "Sign-in failed")}
          </div>
        )}
        {status.type === "success" && (
          <div className="ns-alert ns-alert--success" role="status">
            {normalizeErrorMessage(status.message, "Signed in")}
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
            disabled
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
            disabled
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

          <NSButton type="submit" disabled={isBusy} size="lg" fullWidth>
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
          leadingIcon={<Chrome className="w-4 h-4" />}
        >
          Continue with Google
        </NSButton>

        <Auth0LoginButton />
      </div>
    </AuthLayout>
  );
}
