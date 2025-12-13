import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, UserRound } from "lucide-react";
import AuthLayout from "@/components/Layout/AuthLayout";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import FacebookSignInButton from "@/components/auth/FacebookSignInButton";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const INITIAL_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validate(form) {
  const errors = {};
  const trimmedEmail = form.email.trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.password || form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords must match.";
  }
  if (!form.fullName.trim()) {
    errors.fullName = "Please share your name.";
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
}

export default function Register() {
  const { user, signUp, initializing } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const trimmedName = form.fullName.trim();
      await signUp(form.email.trim(), form.password, {
        displayName: trimmedName,
        fullName: trimmedName,
      });
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error?.message || "We could not create your account.";
      setFormError(message);
      toast.error("Sign-up failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleStart = () => {
    setFormError("");
  };

  const handleGoogleError = (error) => {
    const message =
      error?.message || "We could not start Google authentication.";
    setFormError(message);
    toast.error("Google sign-up failed", { description: message });
  };

  const handleFacebookStart = () => {
    setFormError("");
  };

  const handleFacebookError = (error) => {
    const message =
      error?.message || "We could not start Facebook authentication.";
    setFormError(message);
    toast.error("Facebook sign-up failed", { description: message });
  };

  if (initializing) {
    return (
      <AuthLayout
        eyebrow="Syncing session"
        title="Preparing mission control..."
        subtitle="Hold tight while we confirm your session."
      >
        <div className="ns-auth-stack" role="status">
          <p className="text-white/70 text-sm">
            Checking for an active NorthStar profile.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Create access"
      title="Join the NorthStar mission"
      subtitle="Craft your profile and unlock personalized analytics, copilots, and rituals."
      footer={
        <>
          Already have access? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <div className="ns-auth-stack" data-testid="register-screen">
        {formError && (
          <div
            className="ns-alert"
            role="alert"
            aria-live="polite"
            data-testid="register-error"
          >
            {formError}
          </div>
        )}
        <form
          className="ns-auth-form"
          onSubmit={handleSubmit}
          data-testid="register-form"
        >
          <NSInput
            label="Full name"
            name="fullName"
            autoComplete="name"
            placeholder="Lyra Bennett"
            value={form.fullName}
            onChange={handleChange("fullName")}
            required
            variant="contrast"
            leftIcon={<UserRound className="w-4 h-4" />}
            error={fieldErrors.fullName}
            data-testid="register-name-input"
          />
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
            data-testid="register-email-input"
          />
          <NSInput
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Choose a secure key"
            value={form.password}
            onChange={handleChange("password")}
            required
            variant="contrast"
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.password}
            data-testid="register-password-input"
          />
          <NSInput
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your key"
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
            required
            variant="contrast"
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.confirmPassword}
            data-testid="register-confirm-input"
          />
          <NSButton
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
            data-testid="register-submit-button"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </NSButton>
        </form>

        <div className="ns-auth-divider">
          <span>or</span>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <GoogleSignInButton
            fullWidth
            disabled={isSubmitting}
            onStart={handleGoogleStart}
            onError={handleGoogleError}
            data-testid="register-google-button"
          />
          <FacebookSignInButton
            fullWidth
            disabled={isSubmitting}
            onStart={handleFacebookStart}
            onError={handleFacebookError}
            data-testid="register-facebook-button"
          />
        </div>
      </div>
    </AuthLayout>
  );
}
