import { el } from "../utils/dom.js";
import { ANALYTICAL_QUALIFIER } from "../core/constants.js";
import { expectedValueCard } from "./expectedValueCard.js";
import { sourceLink } from "./sourceLink.js";

export function questionCard({ rule, category, expectedValue, answerControlNode, onHowToCheck, sources }) {
  return el("div", { class: "px-4 py-5" }, [
    el("p", { class: "text-xs font-semibold uppercase tracking-wide text-[var(--accent)] mb-1" }, category?.name ?? ""),
    el("h2", { class: "text-xl font-semibold mb-1.5" }, rule.title),
    el("p", { class: "text-[var(--text-secondary)] mb-4" }, rule.question),
    expectedValueCard(expectedValue, { hasExpectedConfig: Boolean(rule.expected) }),
    answerControlNode,
    el("div", { class: "flex items-center justify-between mt-5" }, [
      onHowToCheck
        ? el("button", { type: "button", class: "text-sm font-medium text-[var(--accent)]", onclick: onHowToCheck }, "How to check")
        : el("span"),
      sources?.length ? sourceLink(sources[0]) : null,
    ]),
    el("p", { class: "text-xs text-[var(--text-secondary)] mt-4 italic" }, ANALYTICAL_QUALIFIER),
  ]);
}
