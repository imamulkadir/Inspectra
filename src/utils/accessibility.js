let liveRegion = null;

// aria-live="polite" for save/progress updates; assertive is reserved for
// critical errors and official stop conditions per section 26.
export function announce(message, { assertive = false } = {}) {
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("role", "status");
    liveRegion.className = "sr-only";
    liveRegion.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;";
    document.body.appendChild(liveRegion);
  }

  liveRegion.setAttribute("aria-live", assertive ? "assertive" : "polite");
  liveRegion.textContent = "";
  // Force a reflow so repeated identical announcements are re-read.
  void liveRegion.offsetWidth;
  liveRegion.textContent = message;
}

export function trapFocus(container) {
  const focusable = () =>
    Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((node) => node.offsetParent !== null);

  function handleKeydown(event) {
    if (event.key !== "Tab") return;
    const items = focusable();
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener("keydown", handleKeydown);
  const items = focusable();
  items[0]?.focus();

  return () => container.removeEventListener("keydown", handleKeydown);
}
