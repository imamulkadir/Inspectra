import { el } from "../utils/dom.js";
import { formatBoolean } from "../utils/formatting.js";

export function variantCard(variant) {
  const isShared = variant.marketCoverageType === "enumerated_countries" &&
    (variant.countriesAndRegionsAsPublishedByApple?.length ?? 0) > 1;

  return el("div", { class: "rounded-2xl border border-[var(--border)] p-4" }, [
    el("div", { class: "flex justify-between items-start mb-1" }, [
      el("span", { class: "font-mono font-semibold" }, variant.aNumber),
      el("span", { class: "text-xs text-[var(--text-secondary)]" }, formatBoolean(variant.physicalSimTray) === "Yes" ? "Physical SIM tray" : "No physical SIM tray"),
    ]),
    el("p", { class: "text-sm text-[var(--text-secondary)] mb-1" }, variant.marketGroupLabel),
    isShared
      ? el("p", { class: "text-xs text-[var(--warning)]" }, "This A-number is shared by multiple markets. It does not establish one exact original sales country by itself.")
      : null,
  ]);
}
