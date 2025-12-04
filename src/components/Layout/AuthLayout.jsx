import PropTypes from "prop-types";
import { cn } from "@/utils";
import "@/App.css";

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  aside,
  className,
}) {
  return (
    <section className="ns-auth-shell">
      <div className="ns-auth-shell__glow" aria-hidden="true" />
      <div className={cn("ns-auth-card ns-auth-card--layout", className)}>
        <div className="ns-auth-panel">
          <div className="ns-auth-panel__header">
            {eyebrow && <p className="ns-eyebrow">{eyebrow}</p>}
            {title && <h1 className="ns-auth-title">{title}</h1>}
            {subtitle && <p className="ns-auth-subtitle">{subtitle}</p>}
          </div>
          <div className="ns-auth-panel__body">{children}</div>
          {footer && <div className="ns-auth-footer">{footer}</div>}
        </div>
        {aside && <aside className="ns-auth-panel__aside">{aside}</aside>}
      </div>
    </section>
  );
}

AuthLayout.propTypes = {
  eyebrow: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  aside: PropTypes.node,
  className: PropTypes.string,
};
