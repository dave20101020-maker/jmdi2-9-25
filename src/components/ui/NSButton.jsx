import * as React from "react";
import PropTypes from "prop-types";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/utils";
import "./NSButton.css";

const VARIANTS = {
  primary: "ns-button--primary",
  secondary: "ns-button--secondary",
  ghost: "ns-button--ghost",
  outline: "ns-button--outline",
};

const SIZES = {
  sm: "ns-button--sm",
  md: "ns-button--md",
  lg: "ns-button--lg",
  pill: "ns-button--pill",
};

const ICON_POSITIONS = {
  leading: "leading",
  trailing: "trailing",
};

const NSButton = React.forwardRef(function NSButton(
  {
    asChild = false,
    variant = "primary",
    size = "md",
    fullWidth = false,
    icon,
    iconPosition = ICON_POSITIONS.leading,
    loading = false,
    disabled: disabledProp,
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
  const isTrailingIcon = icon && iconPosition === ICON_POSITIONS.trailing;
  const isLeadingIcon = icon && iconPosition === ICON_POSITIONS.leading;
  const isDisabled = Boolean(disabledProp || loading);
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

  const content = (
    <span
      className={cn(
        "ns-button__content",
        isTrailingIcon && "ns-button__content--icon-trailing"
      )}
    >
      {loading && <span className="ns-button__spinner" aria-hidden="true" />}
      {isLeadingIcon && !loading && (
        <span className="ns-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ns-button__label">{children}</span>
      {isTrailingIcon && !loading && (
        <span className="ns-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </span>
  );

  return (
    <Comp
      ref={ref}
      className={cn(
        "ns-button",
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && "ns-button--full",
        className
      )}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      data-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      {...componentSpecificProps}
      {...props}
    >
      {content}
    </Comp>
  );
});

NSButton.propTypes = {
  asChild: PropTypes.bool,
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  size: PropTypes.oneOf(Object.keys(SIZES)),
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(Object.values(ICON_POSITIONS)),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  href: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default NSButton;
