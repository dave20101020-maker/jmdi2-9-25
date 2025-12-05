import PropTypes from "prop-types";
import { RotateCw } from "lucide-react";
import NSButton from "@/components/ui/NSButton";

export default function RetryButton({
  label = "Retry connection",
  onRetry,
  loading = false,
  fullWidth = true,
  variant = "secondary",
  size = "lg",
  className,
  "data-testid": dataTestId = "retry-button",
}) {
  return (
    <NSButton
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      loading={loading}
      onClick={onRetry}
      className={className}
      leadingIcon={<RotateCw className="w-4 h-4" />}
      data-testid={dataTestId}
    >
      {label}
    </NSButton>
  );
}

RetryButton.propTypes = {
  label: PropTypes.string,
  onRetry: PropTypes.func,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  variant: PropTypes.string,
  size: PropTypes.string,
  className: PropTypes.string,
  "data-testid": PropTypes.string,
};
