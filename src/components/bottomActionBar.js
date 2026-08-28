import { el } from "../utils/dom.js";

export function bottomActionBar(children, { fixed = true } = {}) {
  return el(
    "div",
    {
      class: `${fixed ? "no-print fixed bottom-0 left-0 right-0 z-20 " : ""}bg-[var(--surface-elevated)] border-t border-[var(--border)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-5 pt-5`,
      // A plain `pb-5` utility can't be used here: the `.safe-bottom` class
      // also sets `padding-bottom` (to reserve the device's home-indicator
      // area) and, being later in the cascade, silently wins over any
      // Tailwind pb-* utility at equal specificity — collapsing the bottom
      // padding to ~0 on screens with no safe-area inset (i.e. everywhere
      // except a real notched/home-indicator device). Setting it inline
      // keeps the same 1.25rem as pt-5 above, plus the device inset on top.
      style: { paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" },
    },
    [el("div", { class: "flex gap-4 max-w-md mx-auto" }, children)],
  );
}
