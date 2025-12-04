import * as React from "react";
import PropTypes from "prop-types";
import { cn } from "@/utils";
import "./InputField.css";

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

const InputField = React.forwardRef(function InputField(
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
  const resolvedDescription =
    description ?? hint ?? (label && placeholder ? placeholder : null);
  const resolvedLeftIcon = leftIcon ?? icon;
  const descriptionId = resolvedDescription
    ? `${inputId}-description`
    : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

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
    <div className={cn("input-field", className)} data-error={!!error}>
      <div
        className={cn(
          "input-field__control",
          error && "input-field__control--error"
        )}
        data-filled={isFilled}
        data-left-icon={!!resolvedLeftIcon}
        data-right-icon={!!rightIcon}
      >
        {resolvedLeftIcon && (
          <span
            className="input-field__icon input-field__icon--left"
            aria-hidden="true"
          >
            {resolvedLeftIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          name={name}
          className={cn("input-field__input", inputClassName)}
          aria-invalid={error ? true : undefined}
          aria-errormessage={errorId}
          aria-describedby={describedBy}
          placeholder={placeholder ?? ""}
          value={value}
          defaultValue={defaultValue}
          required={required}
          onChange={handleChange}
          {...rest}
        />
        {label && (
          <label className="input-field__label" htmlFor={inputId}>
            {label}
            {required && (
              <span className="input-field__required" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        {rightIcon && (
          <span
            className="input-field__icon input-field__icon--right"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>
      {resolvedDescription && (
        <p className="input-field__description" id={descriptionId}>
          {resolvedDescription}
        </p>
      )}
      {error && (
        <p
          className="input-field__error"
          id={errorId}
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
});

InputField.propTypes = {
  label: PropTypes.node,
  description: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  icon: PropTypes.node,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  required: PropTypes.bool,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default InputField;
