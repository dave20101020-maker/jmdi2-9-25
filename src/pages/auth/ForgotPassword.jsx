import { useState } from "react";
import { Link } from "react-router-dom";
import NSInput from "@/components/ui/NSInput";
import NSButton from "@/components/ui/NSButton";
import { useAuth } from "@/hooks/useAuth";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="ns-auth-shell">
      <div className="ns-auth-card">
        <p className="ns-eyebrow">Need a reset?</p>
        <h1 className="ns-auth-title">Send a recovery link</h1>
        <p className="text-white/60 mb-8">
          Enter the email you used for Northstar and we will send secure reset
          instructions.
        </p>

        {status.error && (
          <div className="ns-alert" role="alert">
            {status.error}
          </div>
        )}

        {status.success && (
          <div className="ns-alert ns-alert--success" role="status">
            {status.success}
          </div>
        )}

        <form className="ns-grid" onSubmit={handleSubmit}>
          <NSInput
            label="Email"
            type="email"
            name="email"
            placeholder="you@northstar.app"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <NSButton type="submit" disabled={submitting} fullWidth>
            {submitting ? "Sending link..." : "Send reset link"}
          </NSButton>
        </form>

        <p className="ns-auth-footer">
          Remembered your password?{" "}
          <Link to="/sign-in">Head back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
