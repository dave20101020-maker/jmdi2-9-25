import * as React from "react";
import PropTypes from "prop-types";
import { cn } from "@/utils";
import "./NSInput.css";

const NSInput = React.forwardRef(function NSInput(
  { label, hint, error, icon, className, id, ...props },
  ref
) {
  const inputId =
    id || props.name || `ns-input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={cn("ns-input-group", className)}>
      {label && (
        <label className="ns-input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={cn("ns-input-shell", error && "ns-input-shell--error")}>
        {icon && (
          <span className="ns-input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input id={inputId} ref={ref} className="ns-input" {...props} />
      </div>
      {hint && <p className="ns-input-hint">{hint}</p>}
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
