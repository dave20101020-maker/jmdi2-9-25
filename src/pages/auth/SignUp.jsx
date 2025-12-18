import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, CheckCircle2, Lock, Mail, UserRound } from "lucide-react";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import AuthLayout from "@/components/Layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAuth0 } from "@auth0/auth0-react";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";

const createFieldErrors = () => ({
  fullName: "",
  email: "",
  password: "",
});
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function SignUp() {
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const { loginWithRedirect } = useAuth0();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(createFieldErrors);
  const [formSubmitting, _setFormSubmitting] = useState(false);
  const [oauthSubmitting, _setOauthSubmitting] = useState(false);

  const proofPoints = useMemo(
    () => [
      "Science-backed habit loops",
      "Personalized pillar dashboards",
      "AI copilots for every mission",
    ],
    []
  );

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) {
      setError("");
    }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors(createFieldErrors());
    void loginWithRedirect({ authorizationParams: { screen_hint: "signup" } });
  };

  const handleGoogle = () => {
    setError("");
    void loginWithRedirect({ authorizationParams: { screen_hint: "signup" } });
  };

  if (initializing) {
    return (
      <AuthLayout
        eyebrow="Initializing"
        title="Preparing your cockpit..."
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

  const isBusy = formSubmitting || oauthSubmitting;

  const missionAside = (
    <div className="ns-auth-aside">
      <p className="ns-auth-aside__label">Mission upgrade</p>
      <ul className="ns-auth-aside__list">
        {proofPoints.map((point) => (
          <li key={point} className="ns-auth-aside__item">
            <span className="ns-auth-aside__icon" aria-hidden="true">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AuthLayout
      eyebrow="Create access"
      title="Join the NorthStar mission"
      subtitle="Unlock the premium Galaxy Navy cockpit with AI copilots and habit frameworks."
      aside={missionAside}
      footer={
        <>
          Already have access? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <div className="ns-auth-stack">
        <div className="text-white/70 text-sm" aria-live="polite">
          Email/password login is handled by Auth0
        </div>

        {error && (
          <div className="ns-alert" role="alert">
            {normalizeErrorMessage(error, "Unable to create your account")}
          </div>
        )}

        <form className="ns-auth-form" onSubmit={handleSubmit}>
          <NSInput
            label="Full name"
            name="fullName"
            placeholder="Lyra Bennett"
            leftIcon={<UserRound size={16} />}
            value={form.fullName}
            onChange={handleChange("fullName")}
            autoComplete="name"
            disabled
            variant="contrast"
            error={fieldErrors.fullName}
          />
          <NSInput
            label="Email"
            type="email"
            name="email"
            placeholder="pilot@northstar.app"
            leftIcon={<Mail size={16} />}
            value={form.email}
            onChange={handleChange("email")}
            autoComplete="email"
            disabled
            variant="contrast"
            error={fieldErrors.email}
          />
          <NSInput
            label="Password"
            type="password"
            name="password"
            placeholder="Choose a secure key"
            leftIcon={<Lock size={16} />}
            value={form.password}
            onChange={handleChange("password")}
            autoComplete="new-password"
            disabled
            variant="contrast"
            error={fieldErrors.password}
          />
          <div className="ns-auth-actions ns-auth-actions--baseline">
            <label className="ns-checkbox">
              <input type="checkbox" />
              <span>I agree to the mission terms.</span>
            </label>
          </div>
          <NSButton
            type="submit"
            disabled={isBusy}
            loading={formSubmitting}
            size="lg"
            fullWidth
          >
            Create account
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
