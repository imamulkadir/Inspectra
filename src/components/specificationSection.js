import { el } from "../utils/dom.js";
import { NOT_VERIFIED_LABEL } from "../core/constants.js";

export function specRow(label, value) {
  const display = value === null || value === undefined || value === "" ? NOT_VERIFIED_LABEL : value;
  return el("div", { class: "flex justify-between gap-4 py-2.5 border-b border-[var(--border)] last:border-0" }, [
    el("span", { class: "text-sm text-[var(--text-secondary)]" }, label),
    el("span", { class: "text-sm font-medium text-right" }, String(display)),
  ]);
}

export function specificationSection(title, rows) {
  return el("section", { class: "py-6 border-b border-[var(--border)] last:border-0" }, [
    el("h2", { class: "text-lg font-semibold mb-2" }, title),
    el("div", {}, rows),
  ]);
}
