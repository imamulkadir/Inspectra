import { el } from "../utils/dom.js";

// Section 25.8 — exact finish names, neutral outline markers, never a
// fabricated color swatch (uiColorHex is intentionally null for every
// finish in the supplied dataset).
export function finishList(officialFinishNames) {
  if (!officialFinishNames?.length) {
    return el("p", { class: "text-sm text-[var(--text-secondary)]" }, "Not verified in the current dataset");
  }

  return el(
    "ul",
    { class: "grid grid-cols-2 gap-2" },
    officialFinishNames.map((name) =>
      el("li", { class: "flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2" }, [
        el("span", { class: "w-3.5 h-3.5 rounded-full border-2 border-[var(--text-secondary)]", "aria-hidden": "true" }),
        el("span", { class: "text-sm" }, name),
      ]),
    ),
  );
}
