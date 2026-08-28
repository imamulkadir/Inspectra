import { el, mount, clear } from "../utils/dom.js";
import { trapFocus } from "../utils/accessibility.js";

let root = null;

export function openBottomSheet({ title, content }) {
  root = document.getElementById("dialog-root");
  if (!root) return () => {};

  const previouslyFocused = document.activeElement;

  function close() {
    releaseTrap?.();
    clear(root);
    previouslyFocused?.focus?.();
  }

  // A centered popup, not a bottom sheet — and capped well under the site's
  // own content max-width (max-w-2xl/3xl per page), rather than stretching
  // to the viewport's full width on desktop.
  const sheet = el(
    "div",
    {
      class: "bg-[var(--surface-elevated)] rounded-3xl p-6 max-w-sm w-full mx-4 max-h-[80dvh] overflow-y-auto shadow-xl",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "sheet-title",
    },
    [
      el("div", { class: "flex items-center justify-between mb-4" }, [
        el("h2", { id: "sheet-title", class: "text-lg font-semibold" }, title),
        el("button", { class: "tap-target text-[var(--text-secondary)]", onclick: close, "aria-label": "Close" }, "✕"),
      ]),
      content,
    ],
  );

  mount(
    root,
    el(
      "div",
      { class: "fixed inset-0 z-40 bg-black/40 flex items-center justify-center", onclick: (e) => { if (e.target === e.currentTarget) close(); } },
      [sheet],
    ),
  );

  const releaseTrap = trapFocus(sheet);
  return close;
}
