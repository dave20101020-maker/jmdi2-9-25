import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Facebook } from "lucide-react";
import NSButton from "@/components/ui/NSButton";
import { redirectToFacebookOAuth } from "@/lib/oauth/facebook";

export default function FacebookSignInButton({
  label = "Continue with Facebook",
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
      redirectToFacebookOAuth();
    } catch (error) {
      setPending(false);
      if (onError) {
        onError(error);
      } else {
        console.error("Facebook sign-in failed", error);
      }
    }
  }, [pending, disabled, onStart, onError]);

  return (
    <NSButton
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={`ns-facebook-button ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled || pending}
      loading={pending}
      leadingIcon={<Facebook className="w-4 h-4" />}
      {...buttonProps}
    >
      {label}
    </NSButton>
  );
}

FacebookSignInButton.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
  onStart: PropTypes.func,
  onError: PropTypes.func,
};
