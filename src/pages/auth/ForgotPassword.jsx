import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Shield } from "lucide-react";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import AuthLayout from "@/components/Layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { normalizeErrorMessage } from "@/utils/normalizeErrorMessage";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [submitting, setSubmitting] = useState(false);

  const errorText = status.error
    ? typeof status.error === "string"
      ? status.error
      : normalizeErrorMessage(
          status.error,
          "We could not send the reset email."
        )
    : "";

  const successText = status.success
    ? typeof status.success === "string"
      ? status.success
      : normalizeErrorMessage(
          status.success,
          "Check your inbox for a reset link. It is on the way."
        )
    : "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setSubmitting(true);
    try {
      await resetPassword(email);
      setStatus({
        error: "",
        success: "Check your inbox for a reset link. It is on the way.",
      });
    } catch (err) {
      setStatus({
        success: "",
        error:
          err.code === "auth/user-not-found"
            ? "We could not find an account with that email."
            : "We could not send the reset email. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const securityAside = (
    <div className="ns-auth-aside">
      <p className="ns-auth-aside__label">Security protocol</p>
      <div className="ns-auth-aside__callout">
        <span className="ns-auth-aside__icon" aria-hidden="true">
          <Shield className="w-4 h-4" />
        </span>
        <div>
          <p className="ns-auth-aside__title">Secure channel</p>
          <p className="ns-auth-aside__text">
            Reset links expire in 30 minutes. Use a trusted device and secure
            network.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout
      eyebrow="Need a reset?"
      title="Send a recovery link"
      subtitle="Enter the email you used for Northstar and we will dispatch secure reset instructions."
      aside={securityAside}
      footer={
        <>
          Remembered your password?{" "}
          <Link to="/login">Head back to sign in</Link>
        </>
      }
    >
      <div className="ns-auth-stack">
        {errorText && (
          <div className="ns-alert" role="alert">
            {errorText}
          </div>
        )}

        {successText && (
          <div className="ns-alert ns-alert--success" role="status">
            {successText}
          </div>
        )}

        <form className="ns-auth-form" onSubmit={handleSubmit}>
          <NSInput
            label="Email"
            type="email"
            name="email"
            placeholder="you@northstar.app"
            leftIcon={<Mail size={16} />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            variant="contrast"
          />

          <NSButton
            type="submit"
            disabled={submitting}
            loading={submitting}
            size="lg"
            fullWidth
          >
            {submitting ? "Sending link..." : "Send reset link"}
          </NSButton>
        </form>
      </div>
    </AuthLayout>
  );
}
