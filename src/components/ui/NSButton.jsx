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

const NSButton = React.forwardRef(function NSButton(
  {
    asChild = false,
    variant = "primary",
    size = "md",
    fullWidth = false,
    icon,
    className,
    children,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : "button";

  const content = (
    <span className="ns-button__content">
      {icon && (
        <span className="ns-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ns-button__label">{children}</span>
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
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default NSButton;
