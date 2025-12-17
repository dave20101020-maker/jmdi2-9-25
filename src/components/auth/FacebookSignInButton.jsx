import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Facebook } from "lucide-react";
import NSButton from "@/components/ui/NSButton";
import { useAuth0 } from "@auth0/auth0-react";

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
  const { loginWithRedirect } = useAuth0();

  const handleClick = useCallback(async () => {
    if (pending || disabled) return;
    setPending(true);
    onStart?.();
    try {
      await loginWithRedirect();
    } catch (error) {
      setPending(false);
      if (onError) {
        onError(error);
      } else {
        console.error("Facebook sign-in failed", error);
      }
    }
  }, [pending, disabled, onStart, onError, loginWithRedirect]);

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
