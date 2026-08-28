import { el } from "../utils/dom.js";
import { titleCase } from "../utils/formatting.js";

const STATUS_STYLE = {
  PASS: { bg: "bg-green-50", text: "text-[var(--success)]", icon: "✓" },
  ADVERSE: { bg: "bg-red-50", text: "text-[var(--danger)]", icon: "!" },
  FAIL: { bg: "bg-red-50", text: "text-[var(--danger)]", icon: "✕" },
  WARNING: { bg: "bg-amber-50", text: "text-[var(--warning)]", icon: "!" },
  UNKNOWN: { bg: "bg-gray-100", text: "text-[var(--unknown)]", icon: "?" },
  NOT_TESTED: { bg: "bg-gray-100", text: "text-[var(--text-secondary)]", icon: "○" },
  NOT_APPLICABLE: { bg: "bg-gray-100", text: "text-[var(--text-secondary)]", icon: "⊘" },
  UNAVAILABLE: { bg: "bg-gray-100", text: "text-[var(--text-secondary)]", icon: "⊘" },
  RECORDED: { bg: "bg-blue-50", text: "text-[var(--info)]", icon: "✓" },
};

// Status is never communicated by color alone — every badge pairs a color
// with an icon glyph and the text label (section 26).
export function statusBadge(status) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.UNKNOWN;
  return el(
    "span",
    { class: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}` },
    [el("span", { "aria-hidden": "true" }, style.icon), el("span", {}, titleCase(status))],
  );
}
