import React from "react";
import { Link } from "react-router-dom";

export default function MissionControlCard({
  title,
  description,
  className = "",
  onClick,
  href,
  to,
  disabled = false,
  emphasis = "normal", // "primary" | "normal"
  children,
  ...rest
}) {
  const isInteractive = !disabled && Boolean(onClick || href || to);

  const sharedClassName = [
    "mc-card",
    isInteractive && "mc-card--interactive",
    disabled && "mc-card--disabled",
    emphasis === "primary" && "mc-card--primary",
    "p-4",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {title ? <h3 className="mc-card__title">{title}</h3> : null}
      {description ? <p>{description}</p> : null}
      {children}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        className={sharedClassName}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={disabled ? undefined : href}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        className={sharedClassName}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={disabled || undefined}
      className={sharedClassName}
      onClick={(e) => {
        if (!isInteractive) return;
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        if (!isInteractive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      {...rest}
    >
      {content}
    </div>
  );
}
