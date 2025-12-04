import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";

const ERROR_MESSAGES = {
  "auth/invalid-credential": "Those credentials did not match our records.",
  "auth/user-not-found": "No account found for that email.",
  "auth/wrong-password": "Incorrect password. Try again or reset it.",
  "auth/too-many-requests": "Too many attempts. Please try again in a moment.",
};

function getErrorMessage(error) {
  if (!error) return "";
  if (ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  return "We could not sign you in. Please try again.";
}

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/dashboard";

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmail(form.email, form.password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ns-auth-shell">
      <div className="ns-auth-card">
        <p className="ns-eyebrow">Northstar Access</p>
        <h1 className="ns-auth-title">Sign in to Command</h1>
        <p className="text-white/60 mb-8">
          Continue your mission with the same Base44 control center used across
          the app.
        </p>

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
            placeholder="commander@northstar.app"
            value={form.email}
            onChange={handleChange("email")}
            required
          />
          <NSInput
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your access key"
            value={form.password}
            onChange={handleChange("password")}
            required
          />

          <div className="ns-auth-actions">
            <label className="ns-checkbox">
              <input type="checkbox" name="remember" defaultChecked />
              <span>Remember device</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <NSButton type="submit" disabled={submitting} fullWidth>
            {submitting ? "Signing in..." : "Sign in"}
          </NSButton>
        </form>

        <div className="ns-auth-divider">
          <span>or</span>
        </div>

        <NSButton
          type="button"
          variant="outline"
          fullWidth
          onClick={handleGoogle}
          disabled={submitting}
        >
          Continue with Google
        </NSButton>

        <p className="ns-auth-footer">
          New here? <Link to="/sign-up">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
