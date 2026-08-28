import { el } from "../utils/dom.js";

export function skeleton({ lines = 3, className = "" } = {}) {
  return el(
    "div",
    { class: `animate-pulse space-y-2 ${className}`, "aria-hidden": "true" },
    Array.from({ length: lines }, (_, index) =>
      el("div", { class: "h-4 rounded bg-[var(--surface)]", style: { width: index === lines - 1 ? "60%" : "100%" } }),
    ),
  );
}
