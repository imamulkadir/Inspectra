import { el } from "../utils/dom.js";

export function sourceLink(source) {
  if (!source) return null;
  return el(
    "a",
    {
      href: source.url,
      target: "_blank",
      rel: "noopener noreferrer",
      class: "text-sm text-[var(--accent)] underline decoration-1 underline-offset-2 inline-flex items-center gap-1",
    },
    [source.title ?? source.id, el("span", { "aria-hidden": "true" }, "↗")],
  );
}

export function sourceList(sources) {
  if (!sources?.length) return el("p", { class: "text-sm text-[var(--text-secondary)]" }, "No source metadata available.");
  return el(
    "ul",
    { class: "space-y-1.5" },
    sources.map((source) => el("li", {}, [sourceLink(source), source.verifiedAt ? el("span", { class: "text-xs text-[var(--text-secondary)] ml-1" }, `· verified ${source.verifiedAt}`) : null])),
  );
}
