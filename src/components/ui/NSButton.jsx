import * as React from "react";
import PropTypes from "prop-types";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/utils";
import "./NSButton.css";

const VARIANTS = ["primary", "secondary", "outline", "ghost", "danger"];
const SIZES = ["sm", "md", "lg", "pill", "icon"];
const ICON_POSITIONS = {
  leading: "leading",
  trailing: "trailing",
};

const NSButton = React.forwardRef(function NSButton(
  {
    asChild = false,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    error = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    icon,
    iconPosition = ICON_POSITIONS.leading,
    type = "button",
    href,
    className,
    children,
    ...props
  },
  ref
) {
  const shouldRenderLink = Boolean(href && !asChild);
  const Comp = asChild ? Slot : shouldRenderLink ? "a" : "button";
  const isDisabled = Boolean(disabled || loading);
  const activeVariant = VARIANTS.includes(variant) ? variant : "primary";
  const activeSize = SIZES.includes(size) ? size : "md";
  const derivedLeadingIcon =
    leadingIcon ??
    (icon && iconPosition !== ICON_POSITIONS.trailing ? icon : null);
  const derivedTrailingIcon =
    trailingIcon ??
    (icon && iconPosition === ICON_POSITIONS.trailing ? icon : null);

  const componentSpecificProps = asChild
    ? {}
    : shouldRenderLink
    ? {
        href,
        role: "button",
        tabIndex: isDisabled ? -1 : undefined,
      }
    : {
        type,
        disabled: isDisabled,
      };

  return (
    <Comp
      ref={ref}
      className={cn("ns-button", fullWidth && "ns-button--full", className)}
      data-variant={activeVariant}
      data-size={activeSize}
      data-loading={loading || undefined}
      data-disabled={isDisabled || undefined}
      data-error={error || undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      {...componentSpecificProps}
      {...props}
    >
      <span className="ns-button__inner">
        {loading && <span className="ns-button__spinner" aria-hidden="true" />}
        {derivedLeadingIcon && !loading && (
          <span
            className="ns-button__icon ns-button__icon--leading"
            aria-hidden="true"
          >
            {derivedLeadingIcon}
          </span>
        )}
        <span className="ns-button__label">{children}</span>
        {derivedTrailingIcon && !loading && (
          <span
            className="ns-button__icon ns-button__icon--trailing"
            aria-hidden="true"
          >
            {derivedTrailingIcon}
          </span>
        )}
      </span>
    </Comp>
  );
});

NSButton.displayName = "NSButton";

NSButton.propTypes = {
  asChild: PropTypes.bool,
  variant: PropTypes.oneOf(VARIANTS),
  size: PropTypes.oneOf(SIZES),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  fullWidth: PropTypes.bool,
  leadingIcon: PropTypes.node,
  trailingIcon: PropTypes.node,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(Object.values(ICON_POSITIONS)),
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  href: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default NSButton;
