import { el } from "../utils/dom.js";

const NOT_VERIFIED = "Not verified in the current dataset";

function humanizeKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatScalar(value) {
  if (value === null || value === undefined || value === "") return "unknown";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(formatScalar).join(", ");
  return String(value);
}

// rule.expected can resolve to a plain scalar, an array (e.g. a market-group
// country list), or a compound object (e.g. { actionButton: true, ... } for
// a controls-layout check) — each needs its own display, otherwise a plain
// String(value) on an object renders the literal text "[object Object]"
// (section 24.3 also requires null/unresolved values to say so, not go blank).
function formatExpectedValue(value) {
  if (value === null || value === undefined || value === "") return NOT_VERIFIED;
  if (Array.isArray(value)) {
    return value.length ? value.map(formatScalar).join(", ") : NOT_VERIFIED;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length
      ? entries.map(([key, v]) => `${humanizeKey(key)}: ${formatScalar(v)}`).join(" · ")
      : NOT_VERIFIED;
  }
  return String(value);
}

// Renders whenever the rule declares an `expected` config at all — even when
// it failed to resolve against the current context — rather than hiding the
// row entirely, so a null/unresolved official value never silently reads as
// "nothing to report" (section 24.3).
export function expectedValueCard(expectedValue, { hasExpectedConfig } = {}) {
  if (!hasExpectedConfig) return null;
  const display = expectedValue?.resolved ? formatExpectedValue(expectedValue.value) : NOT_VERIFIED;

  return el("div", { class: "rounded-xl bg-[var(--surface)] px-3.5 py-2.5 text-sm mb-3" }, [
    el("span", { class: "text-[var(--text-secondary)]" }, "Official value: "),
    el("span", { class: "font-medium" }, display),
  ]);
}
