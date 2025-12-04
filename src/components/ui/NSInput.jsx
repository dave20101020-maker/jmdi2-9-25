import * as React from "react";
import PropTypes from "prop-types";
import { cn } from "@/utils";
import "./NSInput.css";

const NSInput = React.forwardRef(function NSInput(
  { label, hint, error, icon, className, id, placeholder, ...props },
  ref
) {
  const generatedId = React.useId();
  const inputId = id || props.name || generatedId;

  const hasControlledValue =
    props.value !== undefined &&
    props.value !== null &&
    `${props.value}` !== "";
  const hasDefaultValue =
    props.defaultValue !== undefined &&
    props.defaultValue !== null &&
    `${props.defaultValue}` !== "";
  const hasValue = hasControlledValue || hasDefaultValue;

  const computedPlaceholder = label ? " " : placeholder;
  const helperText = hint || (label && placeholder ? placeholder : null);

  return (
    <div className={cn("ns-input-group", className)} data-error={!!error}>
      <div
        className={cn(
          "ns-input-shell",
          error && "ns-input-shell--error",
          icon && "ns-input-shell--icon",
          label && "ns-input-shell--floating"
        )}
        data-filled={hasValue}
      >
        {icon && (
          <span className="ns-input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className="ns-input"
          placeholder={computedPlaceholder || " "}
          {...props}
        />
        {label && (
          <label className="ns-input-floating-label" htmlFor={inputId}>
            {label}
          </label>
        )}
      </div>
      {helperText && <p className="ns-input-hint">{helperText}</p>}
      {error && <p className="ns-input-error">{error}</p>}
    </div>
  );
});

NSInput.propTypes = {
  label: PropTypes.node,
  hint: PropTypes.string,
  error: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
};

export default NSInput;
