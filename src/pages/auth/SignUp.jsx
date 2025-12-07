import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, CheckCircle2, Lock, Mail, UserRound } from "lucide-react";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import AuthLayout from "@/components/Layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STATUS_MESSAGES = {
  400: "Please double-check the highlighted fields.",
  409: "That email is already connected to a mission.",
};

const STATUS_FIELD_TARGETS = {
  400: "email",
  409: "email",
};

const DEFAULT_SIGNUP_ERROR =
  "We could not create your account. Please try again.";

const DEFAULT_GOOGLE_ERROR =
  "We couldn't complete Google sign up. Try again in a moment.";

const createFieldErrors = () => ({
  fullName: "",
  email: "",
  password: "",
});
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const IS_DEV = import.meta.env.DEV;

function getErrorMessage(error) {
  if (!error) return DEFAULT_SIGNUP_ERROR;
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
  return DEFAULT_SIGNUP_ERROR;
}

const getGoogleErrorDescription = (error) =>
  getErrorMessage(error) || DEFAULT_GOOGLE_ERROR;

export default function SignUp() {
  const navigate = useNavigate();
  const { user, signUp, signInWithGoogle, initializing } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(createFieldErrors);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);

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

  const logSignUpDebug = (label, payload) => {
    if (!IS_DEV) return;
    console.log(`[SignUp] ${label}`, payload);
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) {
      setError("");
    }
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
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
      setError("Please fix the highlighted fields.");
      return;
    }
    setFormSubmitting(true);
    try {
      logSignUpDebug("email sign-up request", { body: { email: form.email } });
      const trimmedName = form.fullName.trim();
      const profile = await signUp(form.email, form.password, {
        displayName: trimmedName,
        fullName: trimmedName,
      });
      logSignUpDebug("email sign-up response", {
        status: 200,
        userId: profile?._id || profile?.id || profile?.email || trimmedEmail,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      logSignUpDebug("email sign-up error", {
        status: err?.status || err?.code || "unknown",
        message: err?.message,
      });
      const presentable = getErrorMessage(err);
      setError(presentable);
      const status = err?.status || err?.statusCode || err?.response?.status;
      const fieldKey = status ? STATUS_FIELD_TARGETS[status] : null;
      if (fieldKey) {
        setFieldErrors((prev) => ({ ...prev, [fieldKey]: presentable }));
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setOauthSubmitting(true);
    try {
      logSignUpDebug("google sign-up request", { provider: "google" });
      await signInWithGoogle({ redirectPath: "/dashboard" });
      logSignUpDebug("google sign-up redirect", { status: 200 });
      toast.success("Opening Google", {
        description:
          "Complete the Google prompt to finish creating your account.",
      });
    } catch (err) {
      logSignUpDebug("google sign-up error", {
        status: err?.status || err?.code || "unknown",
        message: err?.message,
      });
      const googleMessage = getGoogleErrorDescription(err);
      setError(googleMessage);
      toast.error("Google sign-up failed", {
        description: googleMessage,
      });
    } finally {
      setOauthSubmitting(false);
    }
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

  const trimmedEmail = form.email.trim();
  const isEmailValid = EMAIL_REGEX.test(trimmedEmail);
  const isPasswordValid = form.password.length >= MIN_PASSWORD_LENGTH;
  const isFormValid = isEmailValid && isPasswordValid;
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
          Already have access? <Link to="/sign-in">Sign in</Link>
        </>
      }
    >
      <div className="ns-auth-stack">
        {error && (
          <div className="ns-alert" role="alert">
            {error}
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
            required
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
            required
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
            required
            minLength={6}
            variant="contrast"
            error={fieldErrors.password}
          />
          <div className="ns-auth-actions ns-auth-actions--baseline">
            <label className="ns-checkbox">
              <input type="checkbox" required />
              <span>I agree to the mission terms.</span>
            </label>
          </div>
          <NSButton
            type="submit"
            disabled={!isFormValid || isBusy}
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
