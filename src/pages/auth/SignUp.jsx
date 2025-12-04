import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "That email is already connected to a mission.",
  "auth/weak-password": "Choose a stronger password (at least 6 characters).",
};

function getErrorMessage(error) {
  if (!error) return "";
  if (ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  return "We could not create your account. Please try again.";
}

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signUp(form);
      navigate("/onboarding", { replace: true });
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
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ns-auth-shell">
      <div className="ns-auth-card">
        <p className="ns-eyebrow">Create access</p>
        <h1 className="ns-auth-title">Join the Base44 mission</h1>
        <p className="text-white/60 mb-8">
          One account unlocks your personalized dashboards, AI coach, and habit
          systems.
        </p>

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
            value={form.fullName}
            onChange={handleChange("fullName")}
            autoComplete="name"
            required
          />
          <NSInput
            label="Email"
            type="email"
            name="email"
            placeholder="pilot@northstar.app"
            value={form.email}
            onChange={handleChange("email")}
            autoComplete="email"
            required
          />
          <NSInput
            label="Password"
            type="password"
            name="password"
            placeholder="Choose a secure key"
            value={form.password}
            onChange={handleChange("password")}
            autoComplete="new-password"
            required
            minLength={6}
          />
          <div className="ns-auth-actions ns-auth-actions--baseline">
            <label className="ns-checkbox">
              <input type="checkbox" required />
              <span>I agree to the mission terms.</span>
            </label>
          </div>
          <NSButton type="submit" disabled={submitting} fullWidth>
            {submitting ? "Creating profile..." : "Create account"}
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
          Already have access? <Link to="/sign-in">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
