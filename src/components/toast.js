import { el, mount, clear } from "../utils/dom.js";

let root = null;
let hideTimer = null;

export function showToast(message, { durationMs = 2200 } = {}) {
  if (!root) root = document.getElementById("toast-root");
  if (!root) return;

  clearTimeout(hideTimer);
  mount(
    root,
    el(
      "div",
      { class: "fixed left-1/2 -translate-x-1/2 bottom-24 z-30 bg-[var(--text-primary)] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg" },
      message,
    ),
  );

  hideTimer = setTimeout(() => clear(root), durationMs);
}
