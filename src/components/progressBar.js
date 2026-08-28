import { el } from "../utils/dom.js";

export function progressBar({ current, total, label }) {
  const ratio = total > 0 ? Math.min(1, current / total) : 0;
  return el("div", { class: "px-4 py-2" }, [
    el("div", { class: "flex justify-between text-xs text-[var(--text-secondary)] mb-1.5" }, [
      el("span", {}, label ?? `${current} of ${total}`),
      el("span", {}, `${Math.round(ratio * 100)}%`),
    ]),
    el(
      "div",
      {
        class: "h-1.5 rounded-full bg-[var(--surface)] overflow-hidden",
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": String(total),
        "aria-valuenow": String(current),
      },
      [el("div", { class: "h-full bg-[var(--accent)] transition-all duration-200", style: { width: `${ratio * 100}%` } })],
    ),
  ]);
}
