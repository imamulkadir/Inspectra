import { el, mount, clear } from "../utils/dom.js";
import { button } from "./button.js";
import { trapFocus } from "../utils/accessibility.js";

let root = null;

// The page behind an open dialog/modal must not scroll — without this, a
// touch-drag or wheel event over the dimmed backdrop scrolls the page
// underneath it, which reads as broken since the backdrop looks (and is
// meant to act) like it blocks all interaction with what's behind it.
// The scrolling element here is <html>, not <body> — styles.css sets
// `overflow-y: auto` on the root explicitly (to reserve the scrollbar
// gutter), so locking body.style.overflow alone has no effect.
function lockBodyScroll() {
  const htmlEl = document.documentElement;
  const previousOverflow = htmlEl.style.overflow;
  htmlEl.style.overflow = "hidden";
  return () => {
    htmlEl.style.overflow = previousOverflow;
  };
}

export function openDialog({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, onConfirm }) {
  root = document.getElementById("dialog-root");
  if (!root) return;

  const previouslyFocused = document.activeElement;
  const unlockScroll = lockBodyScroll();

  function close() {
    releaseTrap?.();
    root.removeEventListener("keydown", handleKeydown);
    unlockScroll();
    clear(root);
    previouslyFocused?.focus?.();
  }

  function handleKeydown(event) {
    if (event.key === "Escape") close();
  }

  const panel = el(
    "div",
    { class: "bg-[var(--surface-elevated)] rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "dialog-title" },
    [
      el("h2", { id: "dialog-title", class: "text-lg font-semibold mb-2" }, title),
      el("p", { class: "text-[var(--text-secondary)] mb-6" }, message),
      el("div", { class: "flex gap-3" }, [
        button({ label: cancelLabel, variant: "secondary", onClick: close }),
        button({
          label: confirmLabel,
          variant: destructive ? "destructive" : "primary",
          onClick: () => {
            close();
            onConfirm?.();
          },
        }),
      ]),
    ],
  );

  mount(
    root,
    el(
      "div",
      { class: "fixed inset-0 z-40 bg-black/40 flex items-center justify-center", onclick: (e) => { if (e.target === e.currentTarget) close(); } },
      [panel],
    ),
  );

  const releaseTrap = trapFocus(panel);
  root.addEventListener("keydown", handleKeydown);
}

// A closable info popup (vs. openDialog's confirm/cancel prompt) — arbitrary
// scrollable content under a title, closed via the "X", Escape, or a
// backdrop click. Returns close() so a caller can dismiss it programmatically.
export function openModal({ title, body }) {
  root = document.getElementById("dialog-root");
  if (!root) return () => {};

  const previouslyFocused = document.activeElement;
  const unlockScroll = lockBodyScroll();

  function close() {
    releaseTrap?.();
    root.removeEventListener("keydown", handleKeydown);
    unlockScroll();
    clear(root);
    previouslyFocused?.focus?.();
  }

  function handleKeydown(event) {
    if (event.key === "Escape") close();
  }

  const panel = el(
    "div",
    {
      class: "bg-[var(--surface-elevated)] rounded-3xl p-6 max-w-md w-full mx-4 max-h-[85vh] flex flex-col shadow-xl",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "modal-title",
    },
    [
      el("div", { class: "flex items-start justify-between gap-3 mb-4" }, [
        el("h2", { id: "modal-title", class: "text-lg font-semibold" }, title),
        el(
          "button",
          {
            type: "button",
            class: "tap-target -mr-2 -mt-2 flex items-center justify-center text-[var(--text-secondary)]",
            onclick: close,
            "aria-label": "Close",
          },
          "✕",
        ),
      ]),
      el("div", { class: "overflow-y-auto" }, Array.isArray(body) ? body : [body]),
    ],
  );

  mount(
    root,
    el(
      "div",
      {
        class: "fixed inset-0 z-40 bg-black/40 flex items-center justify-center",
        onclick: (event) => {
          if (event.target === event.currentTarget) close();
        },
      },
      [panel],
    ),
  );

  const releaseTrap = trapFocus(panel);
  root.addEventListener("keydown", handleKeydown);

  return close;
}
