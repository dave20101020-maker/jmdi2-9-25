import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Chrome } from "lucide-react";
import NSButton from "@/components/ui/NSButton";
import { redirectToGoogleOAuth } from "@/lib/oauth/google";

export default function GoogleSignInButton({
  label = "Continue with Google",
  className = "",
  size = "lg",
  fullWidth = true,
  disabled = false,
  variant = "outline",
  onStart,
  onError,
  ...buttonProps
}) {
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(() => {
    if (pending || disabled) return;
    setPending(true);
    onStart?.();
    try {
      redirectToGoogleOAuth();
    } catch (error) {
      setPending(false);
      if (onError) {
        onError(error);
      } else {
        console.error("Google sign-in failed", error);
      }
    }
  }, [pending, disabled, onStart, onError]);

  return (
    <NSButton
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={`ns-google-button ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled || pending}
      loading={pending}
      leadingIcon={<Chrome className="w-4 h-4" />}
      {...buttonProps}
    >
      {label}
    </NSButton>
  );
}

GoogleSignInButton.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
  onStart: PropTypes.func,
  onError: PropTypes.func,
};
