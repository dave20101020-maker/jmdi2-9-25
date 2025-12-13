import React, { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/utils";

const VARIANT_STYLES = {
  primary:
    "bg-gradient-to-r from-[#FACC15] via-[#F4D03F] to-[#FEE440] text-slate-950 shadow-[0_16px_40px_rgba(10,18,45,0.3)] border border-yellow-300/60",
  secondary:
    "bg-slate-900/80 text-white border border-white/15 shadow-[0_14px_30px_rgba(2,6,23,0.45)]",
  ghost: "bg-white/10 text-white border border-white/10 hover:bg-white/15",
  danger:
    "bg-gradient-to-r from-rose-400 to-rose-600 text-slate-950 border border-rose-300/70 shadow-[0_18px_36px_rgba(244,63,94,0.25)]",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D03F] disabled:cursor-not-allowed disabled:opacity-70";

const SPINNER = (
  <span
    className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin"
    aria-hidden="true"
  />
);

const ANALYTICS_ENABLED = import.meta.env.VITE_BUTTON_ANALYTICS === "true";

const logButtonClick = ({ label, page, variant }) => {
  if (!ANALYTICS_ENABLED) return;
  const entry = {
    label: label || "NSButton",
    page: page || "unknown",
    variant,
    ts: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.log("[NSButton] click", entry);
};

const NSButton = forwardRef(function NSButton(
  {
    onClick,
    to,
    variant = "primary",
    loading = false,
    disabled = false,
    fullWidth = false,
    analyticsLabel,
    analyticsPage,
    ariaLabel,
    className,
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;
  const Comp = to ? Link : "button";
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  const sharedProps = {
    ref,
    className: cn(
      BASE_CLASSES,
      variantClass,
      fullWidth && "w-full",
      isDisabled && "pointer-events-none",
      className
    ),
    "aria-label": ariaLabel,
    "aria-disabled": isDisabled || undefined,
    "aria-busy": loading || undefined,
    role: to ? "button" : undefined,
    tabIndex: to && isDisabled ? -1 : rest.tabIndex,
  };

  if (to) {
    return (
      <Comp
        to={to}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          logButtonClick({
            label:
              analyticsLabel ||
              (typeof children === "string" ? children : undefined),
            page: analyticsPage,
            variant,
          });
          if (onClick) onClick(event);
        }}
        {...sharedProps}
        {...rest}
      >
        {loading && SPINNER}
        <span className={loading ? "opacity-80" : undefined}>{children}</span>
      </Comp>
    );
  }

  return (
    <button
      type={rest.type || "button"}
      onClick={
        isDisabled
          ? undefined
          : (event) => {
              logButtonClick({
                label:
                  analyticsLabel ||
                  (typeof children === "string" ? children : undefined),
                page: analyticsPage,
                variant,
              });
              if (onClick) onClick(event);
            }
      }
      disabled={isDisabled}
      {...sharedProps}
      {...rest}
    >
      {loading && SPINNER}
      <span className={loading ? "opacity-80" : undefined}>{children}</span>
    </button>
  );
});

export default NSButton;
