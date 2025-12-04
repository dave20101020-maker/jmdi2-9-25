import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail, Shield, Sparkles } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

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

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(createFieldErrors);
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/dashboard";
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
    const requestBody = { email: form.email };
    logAuthDebug("sign-in request", { body: requestBody });
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      logAuthDebug("sign-in response", {
        status: 200,
        uid: credential?.user?.uid || null,
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
        setError(presentable);
        const fieldKey = FIELD_ERROR_TARGETS[err.code];
        if (fieldKey) {
          setFieldErrors((prev) => ({ ...prev, [fieldKey]: presentable }));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    logAuthDebug("google sign-in request", { provider: "google" });
    try {
      const profile = await signInWithGoogle();
      logAuthDebug("google sign-in response", {
        status: 200,
        json: profile,
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      logAuthDebug("google sign-in error", {
        status: err?.status || err?.code || "unknown",
        message: err?.message,
      });
      if (isAuthError(err)) {
        setError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ns-auth-shell">
      <div className="ns-auth-card space-y-6">
        <div>
          <p className="ns-eyebrow">Base44 Access</p>
          <h1 className="ns-auth-title">Command Center Login</h1>
          <p className="ns-auth-subtitle">
            Authenticate to sync your personalized dashboards, AI copilots, and
            habit loops.
          </p>
        </div>

        {error && (
          <div className="ns-alert" role="alert">
            {error}
          </div>
        )}

        <form className="ns-grid" onSubmit={handleSubmit}>
          <NSInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            icon={<Mail size={16} />}
            placeholder="commander@northstar.app"
            value={form.email}
            onChange={handleChange("email")}
            required
            error={fieldErrors.email}
          />
          <NSInput
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your access key"
            icon={<Lock size={16} />}
            value={form.password}
            onChange={handleChange("password")}
            required
            error={fieldErrors.password}
          />

          <div className="ns-auth-actions">
            <label className="ns-checkbox">
              <input type="checkbox" name="remember" defaultChecked />
              <span>Remember device</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <NSButton type="submit" disabled={submitting} fullWidth>
            {submitting ? (
              <span className="flex items-center justify-center gap-1">
                Signing in
                <span className="ns-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            ) : (
              "Sign in"
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

        <div className="grid grid-cols-1 gap-3 text-sm text-white/70 mt-6">
          {benefits.map(({ label, icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
            >
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                {icon}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <p className="ns-auth-footer">
          New here? <Link to="/sign-up">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
