import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chrome, CheckCircle2, Lock, Mail, UserRound } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

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

const IS_DEV = import.meta.env.DEV;

function getErrorMessage(error) {
  if (!error) return "";
  if (ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  return "We could not create your account. Please try again.";
}

export default function SignUp() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(createFieldErrors);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    try {
      logSignUpDebug("google sign-up request", { provider: "google" });
      const profile = await signInWithGoogle();
      logSignUpDebug("google sign-up response", { status: 200, json: profile });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      logSignUpDebug("google sign-up error", {
        status: err?.status || err?.code || "unknown",
        message: err?.message,
      });
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ns-auth-shell">
      <div className="ns-auth-card space-y-6">
        <div>
          <p className="ns-eyebrow">Create access</p>
          <h1 className="ns-auth-title">Join the Base44 mission</h1>
          <p className="ns-auth-subtitle">
            Unlock the premium Galaxy Navy cockpit with AI copilots and habit
            frameworks.
          </p>
        </div>

        {error && (
          <div className="ns-alert" role="alert">
            {error}
          </div>
        )}

        <form className="ns-grid" onSubmit={handleSubmit}>
          <NSInput
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
          <NSInput
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
          <NSInput
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
          <NSButton type="submit" disabled={submitting} fullWidth>
            {submitting ? (
              <span className="flex items-center justify-center gap-1">
                Creating profile
                <span className="ns-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            ) : (
              "Create account"
            )}
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
          disabled={submitting}
          icon={<Chrome className="w-4 h-4" />}
        >
          Continue with Google
        </NSButton>

        <div className="grid gap-3 text-white/80 text-sm">
          {proofPoints.map((point) => (
            <div
              key={point}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <span className="w-7 h-7 rounded-full bg-[#1e40af]/40 flex items-center justify-center text-[#f5d76e]">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        <p className="ns-auth-footer">
          Already have access? <Link to="/sign-in">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
