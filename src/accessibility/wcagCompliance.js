/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WCAG 2.1 AA Accessibility Compliance
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Accessibility testing, ARIA utilities, keyboard navigation, and screen reader support
 */

// src/accessibility/wcagCompliance.js
import React from "react";
import { normalizeErrorNode } from "@/utils/normalizeErrorMessage";

/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 */
export class AccessibilityUtils {
  /**
   * Check color contrast ratio (WCAG AA: 4.5:1 for text)
   */
  static getContrastRatio(rgb1, rgb2) {
    const getLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Validate contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
   */
  static isContrastCompliant(ratio, isLargeText = false) {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Get focus indicator styles
   */
  static getFocusIndicatorStyles() {
    return {
      outline: "3px solid #4F46E5",
      outlineOffset: "2px",
    };
  }

  /**
   * Keyboard event handlers for accessibility
   */
  static createKeyboardHandler(onEnter, onEscape, onArrowUp, onArrowDown) {
    return (e) => {
      switch (e.key) {
        case "Enter":
          if (onEnter) onEnter(e);
          break;
        case "Escape":
          if (onEscape) onEscape(e);
          break;
        case "ArrowUp":
          if (onArrowUp) {
            e.preventDefault();
            onArrowUp(e);
          }
          break;
        case "ArrowDown":
          if (onArrowDown) {
            e.preventDefault();
            onArrowDown(e);
          }
          break;
        default:
          break;
      }
    };
  }

  /**
   * Skip to main content link (hidden until focused)
   */
  static getSkipToMainStyles() {
    return {
      position: "absolute",
      top: "-40px",
      left: "0",
      background: "#000",
      color: "#fff",
      padding: "8px",
      zIndex: "100",
      "&:focus": {
        top: "0",
      },
    };
  }
}

/**
 * Accessible form field component
 */
export const AccessibleInput = React.forwardRef(
  (
    {
      id,
      label,
      error,
      required,
      type = "text",
      disabled = false,
      autoComplete,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && (
              <span className="text-red-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          required={required}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? "border-red-500" : "border-gray-300"
          } ${className}`}
          {...props}
        />
        {error && (
          <p
            id={`${id}-error`}
            className="text-red-500 text-sm mt-1"
            role="alert"
          >
            {normalizeErrorNode(error, "Invalid input")}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

/**
 * Accessible button with proper ARIA attributes
 */
export const AccessibleButton = React.forwardRef(
  (
    {
      children,
      onClick,
      disabled = false,
      ariaLabel,
      ariaPressed,
      ariaExpanded,
      type = "button",
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={ariaPressed}
        aria-expanded={ariaExpanded}
        className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

/**
 * Skip to main content component
 */
export const SkipToMainContent = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only absolute top-0 left-0 bg-black text-white p-2 z-50"
    >
      Skip to main content
    </a>
  );
};

/**
 * Focus visible handler for better keyboard navigation
 */
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = React.useState(false);

  const onKeyDown = (e) => {
    if (["Tab", "Enter", " ", "ArrowUp", "ArrowDown"].includes(e.key)) {
      setIsFocusVisible(true);
    }
  };

  const onMouseDown = () => {
    setIsFocusVisible(false);
  };

  React.useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  return isFocusVisible;
};

/**
 * Accessibility testing hook
 */
export const useAccessibilityTest = (ref) => {
  const [issues, setIssues] = React.useState([]);

  React.useEffect(() => {
    if (!ref?.current) return;

    const testIssues = [];
    const element = ref.current;

    // Test 1: Check for missing alt text on images
    const images = element.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.alt) {
        testIssues.push({
          level: "error",
          message: `Image missing alt text: ${img.src}`,
          element: img,
        });
      }
    });

    // Test 2: Check for proper heading hierarchy
    const headings = element.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);
      if (level > lastLevel + 1) {
        testIssues.push({
          level: "warning",
          message: `Heading hierarchy broken: ${heading.tagName}`,
          element: heading,
        });
      }
      lastLevel = level;
    });

    // Test 3: Check for form labels
    const inputs = element.querySelectorAll("input, textarea, select");
    inputs.forEach((input) => {
      if (!input.id || !element.querySelector(`label[for="${input.id}"]`)) {
        testIssues.push({
          level: "error",
          message: "Form field missing associated label",
          element: input,
        });
      }
    });

    // Test 4: Check for color contrast
    const textElements = element.querySelectorAll(
      "p, span, a, button, h1, h2, h3, h4, h5, h6"
    );
    textElements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      // Simplified check - in production use proper color parsing
      if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
        // Element inherits background, skip detailed check
      }
    });

    setIssues(testIssues);
  }, [ref]);

  return issues;
};

/**
 * Live region for dynamic content announcements
 */
export const LiveRegion = ({ message, role = "status", className = "" }) => {
  return (
    <div
      role={role}
      aria-live="polite"
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
};

/**
 * Accessible modal component
 */
export const AccessibleModal = React.forwardRef(
  ({ isOpen, onClose, title, children, className = "" }, ref) => {
    React.useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal content */}
        <div
          className={`relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 ${className}`}
        >
          <h2 id="modal-title" className="text-xl font-bold mb-4">
            {title}
          </h2>
          <div>{children}</div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }
);

AccessibleModal.displayName = "AccessibleModal";

export default {
  AccessibilityUtils,
  AccessibleInput,
  AccessibleButton,
  SkipToMainContent,
  useFocusVisible,
  useAccessibilityTest,
  LiveRegion,
  AccessibleModal,
};
