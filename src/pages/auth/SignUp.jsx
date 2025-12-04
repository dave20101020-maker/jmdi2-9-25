import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, CheckCircle2, Lock, Mail, UserRound } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import InputField from "@/components/ui/InputField";
import NSButton from "@/components/ui/NSButton";
import AuthLayout from "@/components/Layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "That email is already connected to a mission.",
  "auth/weak-password": "Choose a stronger password (at least 6 characters).",
};

const FIELD_ERROR_TARGETS = {
  "auth/email-already-in-use": "email",
  "auth/invalid-email": "email",
  "auth/weak-password": "password",
};

const createFieldErrors = () => ({
  fullName: "",
  email: "",
  password: "",
});
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const IS_DEV = import.meta.env.DEV;

function getErrorMessage(error) {
  if (!error) return "";
  if (ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  return "We could not create your account. Please try again.";
}

const getGoogleErrorDescription = (error) => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "this domain";
  switch (error?.code) {
    case "auth/unauthorized-domain":
      return `Google Sign-Up is not allowed from ${origin}. Add this origin under Firebase Authentication → Settings → Authorized domains.`;
    case "auth/popup-blocked":
      return "Your browser blocked the Google popup. Please allow popups for this site and try again.";
    case "auth/popup-closed-by-user":
      return "The Google popup closed before sign-up completed. Please try again.";
    default:
      return getErrorMessage(error);
  }
};

export default function SignUp() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
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
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const trimmedName = form.fullName.trim();
      if (trimmedName) {
        await updateProfile(credential.user, { displayName: trimmedName });
      }
      logSignUpDebug("email sign-up response", {
        status: 200,
        uid: credential?.user?.uid || null,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      logSignUpDebug("email sign-up error", {
        status: err?.status || err?.code || "unknown",
        message: err?.message,
      });
      const presentable = getErrorMessage(err);
      setError(presentable);
      const fieldKey = FIELD_ERROR_TARGETS[err.code];
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
      const profile = await signInWithGoogle();
      logSignUpDebug("google sign-up response", { status: 200, json: profile });
      toast.success("Google account linked", {
        description:
          profile?.fullName ||
          profile?.displayName ||
          profile?.email ||
          "Welcome aboard.",
      });
      navigate("/dashboard", { replace: true });
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

  if (authLoading) {
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
      title="Join the Base44 mission"
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
          <InputField
            label="Full name"
            name="fullName"
            placeholder="Lyra Bennett"
            icon={<UserRound size={16} />}
            value={form.fullName}
            onChange={handleChange("fullName")}
            autoComplete="name"
            required
            error={fieldErrors.fullName}
          />
          <InputField
            label="Email"
            type="email"
            name="email"
            placeholder="pilot@northstar.app"
            icon={<Mail size={16} />}
            value={form.email}
            onChange={handleChange("email")}
            autoComplete="email"
            required
            error={fieldErrors.email}
          />
          <InputField
            label="Password"
            type="password"
            name="password"
            placeholder="Choose a secure key"
            icon={<Lock size={16} />}
            value={form.password}
            onChange={handleChange("password")}
            autoComplete="new-password"
            required
            minLength={6}
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
          fullWidth
          onClick={handleGoogle}
          disabled={isBusy}
          loading={oauthSubmitting}
          icon={<Chrome className="w-4 h-4" />}
        >
          Continue with Google
        </NSButton>
      </div>
    </AuthLayout>
  );
}
