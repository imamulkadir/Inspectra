import { el } from "../utils/dom.js";
import { button } from "./button.js";

// section 7.3 — the blocking screen shown when the dataset is missing or
// invalid. Never falls back to mock content.
export function dataError({ message, onRetry }) {
  return el("div", { class: "min-h-[60dvh] flex items-center justify-center px-6 text-center" }, [
    el("div", { class: "max-w-sm" }, [
      el("h2", { class: "text-lg font-semibold mb-2" }, "Device data is unavailable"),
      el(
        "p",
        { class: "text-[var(--text-secondary)] mb-6" },
        message ?? "Inspectra could not load the supplied iPhone dataset. Place the validated dataset inside data/iphone/ and reload the application.",
      ),
      onRetry ? button({ label: "Retry", onClick: onRetry }) : null,
    ]),
  ]);
}
