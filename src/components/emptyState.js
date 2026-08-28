import { el } from "../utils/dom.js";

export function emptyState({ title, message, action = null }) {
  return el("div", { class: "text-center py-16 px-6" }, [
    el("h2", { class: "text-lg font-semibold mb-2" }, title),
    el("p", { class: "text-[var(--text-secondary)] mb-6" }, message),
    action,
  ]);
}
