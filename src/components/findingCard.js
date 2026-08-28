import { el } from "../utils/dom.js";
import { statusBadge } from "./statusBadge.js";

// A finding's raw answer.status is the answer OPTION's generic UI default
// (section 14.4) — it is NOT the rule-specific interpretation, so it can
// disagree with the bucket the finding was actually sorted into (e.g. an
// answer worded "Yes" defaults to a generic PASS-shaped status even on a
// rule where "Yes" is adverse). Showing that raw label here previously let a
// card under "Needs attention" display a green "Pass" badge next to it —
// contradictory and confusing. The badge is keyed off `variant` (the same
// classification reportEngine already sorted the finding into) instead, so
// it can never disagree with its own section.
const VARIANT_BADGE = {
  adverse: "ADVERSE",
  positive: "PASS",
  unresolved: "UNKNOWN",
  not_tested: "NOT_TESTED",
  unavailable: "UNAVAILABLE",
};

export function findingCard(finding, variant = "positive") {
  return el("div", { class: "rounded-2xl border border-[var(--border)] p-4" }, [
    el("div", { class: "flex items-start justify-between gap-3 mb-1" }, [
      el("h3", { class: "font-medium text-sm" }, finding.title ?? finding.ruleId),
      statusBadge(VARIANT_BADGE[variant] ?? "UNKNOWN"),
    ]),
    finding.answer?.value != null
      ? el("p", { class: "text-sm text-[var(--text-secondary)]" }, String(finding.answer.value))
      : null,
    finding.answer?.provenance
      ? el("p", { class: "text-xs text-[var(--text-secondary)] mt-1" }, finding.answer.provenance.replace(/_/g, " "))
      : null,
  ]);
}
