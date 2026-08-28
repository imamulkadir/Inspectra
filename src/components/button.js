import { el } from "../utils/dom.js";

const VARIANTS = {
  primary: "bg-[var(--accent)] text-white active:bg-[var(--accent-pressed)]",
  secondary: "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]",
  destructive: "bg-[var(--danger)] text-white",
  ghost: "bg-transparent text-[var(--accent)]",
};

export function button({ label, onClick, variant = "primary", full = true, disabled = false, type = "button" }) {
  return el("button", {
    type,
    class: `tap-target rounded-2xl font-semibold py-3 px-6 transition-opacity ${VARIANTS[variant] ?? VARIANTS.primary} ${full ? "w-full" : ""} ${disabled ? "opacity-40 pointer-events-none" : ""}`,
    onclick: onClick,
    disabled,
  }, label);
}
