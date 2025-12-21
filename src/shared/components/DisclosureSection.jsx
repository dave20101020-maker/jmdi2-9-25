import { useState } from "react";

export default function DisclosureSection({
  title = "More context",
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="disclosure disclosure-section">
      <button
        type="button"
        className="disclosure__toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {title}
      </button>

      {open && <div className="disclosure__content">{children}</div>}
    </section>
  );
}
