import * as React from "react";
import PropTypes from "prop-types";
import { cn } from "@/utils";
import { normalizeErrorNode } from "@/utils/normalizeErrorMessage";
import "./NSInput.css";

const VARIANTS = ["default", "contrast", "subtle"];
const SIZES = ["sm", "md", "lg"];

const hasContent = (value, defaultValue) => {
  const candidate = value ?? defaultValue;
  if (candidate === undefined || candidate === null) {
    return false;
  }
  if (typeof candidate === "string") {
    return candidate.trim().length > 0;
  }
  return `${candidate}`.trim().length > 0;
};

const NSInput = React.forwardRef(function NSInput(
  {
    label,
    description,
    hint,
    error,
    leftIcon,
    rightIcon,
    icon,
    className,
    inputClassName,
    variant = "default",
    size = "md",
    loading = false,
    disabled = false,
    id,
    name,
    required,
    onChange,
    placeholder,
    value,
    defaultValue,
    ...rest
  },
  ref
) {
  const generatedId = React.useId();
  const inputId = id || name || generatedId;
  const resolvedDescription = description ?? hint ?? null;
  const resolvedLeftIcon = leftIcon ?? icon;
  const descriptionId = resolvedDescription
    ? `${inputId}-description`
    : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const activeVariant = VARIANTS.includes(variant) ? variant : "default";
  const activeSize = SIZES.includes(size) ? size : "md";
  const isError = Boolean(error);
  const isDisabled = Boolean(disabled);

  const isControlled = value !== undefined;
  const [isFilled, setIsFilled] = React.useState(() =>
    hasContent(value, defaultValue)
  );

  React.useEffect(() => {
    if (isControlled) {
      setIsFilled(hasContent(value, defaultValue));
    }
  }, [isControlled, value, defaultValue]);

  const handleChange = React.useCallback(
    (event) => {
      if (!isControlled) {
        setIsFilled(event.currentTarget.value.trim().length > 0);
      }
      onChange?.(event);
    },
    [isControlled, onChange]
  );

  return (
    <div className={cn("ns-input", className)}>
      <div
        className="ns-input__control"
        data-variant={activeVariant}
        data-size={activeSize}
        data-filled={isFilled || undefined}
        data-left-icon={resolvedLeftIcon ? "true" : undefined}
        data-right-icon={rightIcon ? "true" : undefined}
        data-error={isError || undefined}
        data-disabled={isDisabled || undefined}
        data-loading={loading || undefined}
      >
        {resolvedLeftIcon && (
          <span
            className="ns-input__icon ns-input__icon--left"
            aria-hidden="true"
          >
            {resolvedLeftIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          name={name}
          className={cn("ns-input__input", inputClassName)}
          aria-invalid={isError || undefined}
          aria-errormessage={errorId}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          placeholder={placeholder ?? ""}
          value={value}
          defaultValue={defaultValue}
          required={required}
          disabled={isDisabled}
          onChange={handleChange}
          {...rest}
        />
        {label && (
          <label className="ns-input__label" htmlFor={inputId}>
            {label}
            {required && (
              <span className="ns-input__required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {loading && <span className="ns-input__spinner" aria-hidden="true" />}
        {rightIcon && !loading && (
          <span
            className="ns-input__icon ns-input__icon--right"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>
      {resolvedDescription && (
        <p className="ns-input__description" id={descriptionId}>
          {resolvedDescription}
        </p>
      )}
      {isError && (
        <p
          className="ns-input__error"
          id={errorId}
          role="alert"
          aria-live="polite"
        >
          {normalizeErrorNode(error, "Invalid input")}
        </p>
      )}
    </div>
  );
});

NSInput.displayName = "NSInput";

NSInput.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  icon: PropTypes.node,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  variant: PropTypes.oneOf(VARIANTS),
  size: PropTypes.oneOf(SIZES),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  required: PropTypes.bool,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default NSInput;
