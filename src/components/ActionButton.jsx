import React from "react";
import { cn } from "@/utils";

/**
 * ActionButton - Versatile button component with multiple variants
 * @param {ReactNode} children - Button content
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
 * @param {string} size - 'xs' | 'sm' | 'md' | 'lg'
 * @param {boolean} fullWidth - Make button full width
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {string} icon - Optional icon (left side)
 * @param {string} iconRight - Optional icon (right side)
 * @param {function} onClick - Click handler
 * @param {string} type - Button type: 'button' | 'submit' | 'reset'
 */
export const ActionButton = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconRight,
  onClick,
  type = "button",
  className,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800",
    outline:
      "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-400",
    ghost:
      "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 active:bg-green-800",
  };

  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-xs gap-1.5",
    sm: "px-3 py-2 text-sm gap-2",
    md: "px-4 py-2.5 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-3",
  };

  const iconSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        (disabled || loading) && "cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Loading Spinner */}
      {loading && (
        <svg
          className={cn("animate-spin", iconSizeClasses[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left Icon */}
      {!loading && icon && (
        <span className={cn("flex-shrink-0", iconSizeClasses[size])}>
          {icon}
        </span>
      )}

      {/* Button Content */}
      <span className={loading ? "opacity-0" : ""}>{children}</span>

      {/* Right Icon */}
      {!loading && iconRight && (
        <span className={cn("flex-shrink-0", iconSizeClasses[size])}>
          {iconRight}
        </span>
      )}
    </button>
  );
};

export default ActionButton;
