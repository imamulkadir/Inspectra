import { el } from "../utils/dom.js";

export function siteFooter() {
  return el("footer", { class: "no-print border-t border-[var(--border)] px-5 py-6 text-center" }, [
    el(
      "p",
      { class: "text-xs text-[var(--text-secondary)] mb-2" },
      "Inspectra provides an analytical assessment based on entered data and guided checks. It is not a guarantee of authenticity, condition, ownership, or value.",
    ),
    el("div", { class: "flex items-center justify-center gap-4 text-xs" }, [
      el("a", { href: "#/privacy", class: "text-[var(--accent)] underline" }, "Privacy"),
      el("a", { href: "#/terms", class: "text-[var(--accent)] underline" }, "Terms"),
    ]),
    el("p", { class: "text-[11px] text-[var(--text-secondary)] mt-2" }, `© ${new Date().getFullYear()} Inspectra`),
  ]);
}
