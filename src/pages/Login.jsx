import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Chrome, Lock, Mail } from "lucide-react";
import AuthLayout from "@/components/Layout/AuthLayout";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const INITIAL_FORM = { email: "", password: "" };

function validate(form) {
  const errors = {};
  const trimmedEmail = form.email.trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.password || form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
}

export default function Login() {
  const { user, signIn, signInWithGoogle, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!initializing && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [initializing, user, navigate]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (formError) {
      setFormError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { errors, isValid } = validate(form);
    if (!isValid) {
      setFieldErrors(errors);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      await signIn(form.email.trim(), form.password);
      toast.success("Welcome back");
      const redirect = location.state?.from?.pathname || "/dashboard";
      navigate(redirect, { replace: true });
    } catch (error) {
      const message = error?.message || "We could not sign you in.";
      setFormError(message);
      toast.error("Sign-in failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (!signInWithGoogle) return;
    setIsGoogleSubmitting(true);
    setFormError("");
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
      const redirect = location.state?.from?.pathname || "/dashboard";
      navigate(redirect, { replace: true });
    } catch (error) {
      const message =
        error?.message || "We could not complete Google authentication.";
      setFormError(message);
      toast.error("Google sign-in failed", { description: message });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <AuthLayout
        eyebrow="Syncing session"
        title="Preparing your cockpit..."
        subtitle="Hold tight while we confirm your NorthStar credentials."
      >
        <div className="ns-auth-stack" role="status">
          <p className="text-white/70 text-sm">
            Checking for an active mission session.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="NorthStar Access"
      title="Command Center Login"
      subtitle="Authenticate to sync your personalized dashboards, copilots, and rituals."
      footer={
        <>
          Need an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      <div className="ns-auth-stack" data-testid="login-screen">
        {formError && (
          <div className="ns-alert" role="alert" data-testid="login-error">
            {formError}
          </div>
        )}
        <form
          className="ns-auth-form"
          onSubmit={handleSubmit}
          data-testid="login-form"
        >
          <NSInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="pilot@northstar.app"
            value={form.email}
            onChange={handleChange("email")}
            required
            variant="contrast"
            leftIcon={<Mail className="w-4 h-4" />}
            error={fieldErrors.email}
            data-testid="login-email-input"
          />
          <NSInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your access key"
            value={form.password}
            onChange={handleChange("password")}
            required
            variant="contrast"
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.password}
            data-testid="login-password-input"
          />
          <NSButton
            type="submit"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting || isGoogleSubmitting}
            data-testid="login-submit-button"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </NSButton>
        </form>

        {signInWithGoogle && (
          <>
            <div className="ns-auth-divider">
              <span>or</span>
            </div>
            <NSButton
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleGoogle}
              disabled={isSubmitting || isGoogleSubmitting}
              loading={isGoogleSubmitting}
              className="ns-google-button"
              leadingIcon={<Chrome className="w-4 h-4" />}
              data-testid="login-google-button"
            >
              Continue with Google
            </NSButton>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
