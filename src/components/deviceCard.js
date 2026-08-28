import { el } from "../utils/dom.js";
import { formatStorage } from "../utils/formatting.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";

export function deviceCard(device) {
  const storageSummary = (device.storageGB ?? []).map(formatStorage).join(" / ");

  return el(
    "button",
    {
      class:
        "text-left w-full rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 active:scale-[0.99] transition-transform hover:ring-1 hover:ring-inset hover:ring-[var(--accent)]",
      onclick: () => router.navigate(ROUTES.model(device.id)),
    },
    [
      el("div", { class: "flex items-center justify-between mb-1" }, [
        el("h3", { class: "text-base font-semibold" }, device.marketingName),
        el("span", { class: "text-xs text-[var(--text-secondary)]" }, String(device.introducedYear ?? "")),
      ]),
      el("p", { class: "text-sm text-[var(--text-secondary)] mb-3" }, storageSummary || "Storage not verified"),
      el(
        "div",
        { class: "flex flex-wrap gap-1.5" },
        (device.officialFinishNames ?? []).slice(0, 4).map((name) =>
          el("span", { class: "text-xs rounded-full border border-[var(--border)] px-2 py-1" }, name),
        ),
      ),
    ],
  );
}
