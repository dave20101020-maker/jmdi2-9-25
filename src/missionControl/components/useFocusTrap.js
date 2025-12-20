import React from "react";

const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

function getFocusable(container) {
  if (!container) return [];

  const nodes = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

  return nodes.filter((node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (node.getAttribute("aria-hidden") === "true") return false;
    if (node.tabIndex < 0) return false;
    return true;
  });
}

/**
 * Traps focus within a container while active.
 * - Cycles Tab/Shift+Tab
 * - Auto-focuses first focusable element
 */
export function useFocusTrap(containerRef, isActive) {
  React.useEffect(() => {
    const container = containerRef?.current;
    if (!isActive || !container) return;

    const focusable = getFocusable(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      container.focus();
    }

    function onKeyDown(e) {
      if (e.key !== "Tab") return;

      const items = getFocusable(container);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [containerRef, isActive]);
}
