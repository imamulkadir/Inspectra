import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { findingCard } from "../components/findingCard.js";
import { sourceList } from "../components/sourceLink.js";
import { progressBar } from "../components/progressBar.js";
import { button } from "../components/button.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { getInspectionCatalog } from "../data/catalog.js";
import { getInspection, saveReport } from "../storage/inspectionRepository.js";
import { buildReport } from "../engines/reportEngine.js";
import { formatDateTime } from "../utils/dates.js";

export async function mountPage(root, { params }) {
  const page = el("div", { id: "main", class: "pb-16" }, [
    appHeader({ title: "Report", onBack: () => router.navigate(ROUTES.saved) }),
    el("div", { id: "report-body", class: "md:max-w-3xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 10 })])]),
  ]);
  mount(root, page);

  // Every branch below resumes after an `await`. If the user has since
  // navigated away, the router will have already unmounted this page and
  // replaced #report-body's content with a different route's DOM — in that
  // case root.querySelector("#report-body") returns null, and touching it
  // (mount()/clear() both dereference .firstChild) crashes the whole app
  // via an unhandled rejection. Bail out quietly whenever that's happened.
  const stillMounted = () => Boolean(root.querySelector("#report-body"));

  let catalog;
  let record;
  try {
    [catalog, record] = await Promise.all([getInspectionCatalog(), getInspection(params.id)]);
  } catch (error) {
    if (!stillMounted()) return () => {};
    mount(root.querySelector("#report-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }
  if (!stillMounted()) return () => {};
  if (!record) {
    mount(root.querySelector("#report-body"), dataError({ message: `Inspection "${params.id}" was not found on this device.` }));
    return () => {};
  }

  const report = buildReport({
    inspection: {
      ...record,
      orderedRuleIds: [...new Set([...record.orderedRuleIds, ...(record.followUpRuleIds ?? []), ...(record.resetRuleIds ?? [])])],
    },
    dataset: catalog,
    indexes: catalog,
    identification: record.identificationSnapshot ?? { device: record.context?.device, variant: record.context?.variant, iosParsed: record.context?.iosParsed },
  });

  await saveReport(report).catch((error) => console.error("[Inspectra] Report snapshot failed:", error));

  if (!stillMounted()) return () => {};
  const body = root.querySelector("#report-body");
  clear(body);

  const hasStopCondition = report.officialStopConditions.length > 0;
  const resetIncomplete = !report.resetVerification?.completed;
  const hasAdverse = report.adverseFindings.length > 0;

  body.appendChild(
    el("div", { class: "px-4 py-4 space-y-5" }, [
      letterhead(report),

      el("div", {}, [
        el("h2", { class: "text-2xl font-bold" }, report.deviceSnapshot?.marketingName ?? "Unknown device"),
        el("p", { class: "text-sm text-[var(--text-secondary)] mt-0.5" }, `${report.variantSnapshot?.marketGroupLabel ?? "Market group not resolved"} · generated ${formatDateTime(report.generatedAt)}`),
        report.priceContext
          ? el("p", { class: "text-sm mt-1" }, [
              el("span", { class: "text-[var(--text-secondary)]" }, "Seller's asking price: "),
              el("span", { class: "font-medium" }, report.priceContext),
            ])
          : null,
      ]),

      summaryBanner({ hasStopCondition, resetIncomplete, hasAdverse, adverseCount: report.adverseFindings.length }),

      report.officialStopConditions.length
        ? section("Official stop conditions", report.officialStopConditions.map((c) => el("div", { class: "rounded-2xl bg-red-50 border border-red-300 p-4", role: "alert" }, [
            el("p", { class: "font-semibold text-[var(--danger)]" }, c.level),
            el("p", { class: "text-sm text-[var(--danger)]" }, c.message),
          ])))
        : null,

      resetIncomplete
        ? section(null, [el("div", { class: "rounded-2xl bg-amber-50 border border-amber-300 p-4" }, [el("p", { class: "text-sm font-semibold text-[var(--warning)]" }, "Final reset verification was not completed.")])])
        : null,

      report.identityFindings.length
        ? section("Identity inconsistencies", report.identityFindings.map((f) => el("p", { class: "text-sm rounded-xl bg-red-50 p-3" }, f.message)))
        : section("Identity", [el("p", { class: "text-sm text-[var(--text-secondary)]" }, "No identity inconsistency was detected in the completed checks.")]),

      section(`Needs attention (${report.adverseFindings.length})`, report.adverseFindings.length
        ? report.adverseFindings.map((f) => findingCard(f, "adverse"))
        : [el("p", { class: "text-sm text-[var(--text-secondary)]" }, "None reported.")]),

      section("Checklist completion", [
        progressBar({
          current: report.checklistCompletion.numerator,
          total: report.checklistCompletion.denominator,
          label: `${report.checklistCompletion.numerator} of ${report.checklistCompletion.denominator} applicable checks completed`,
        }),
        el("p", { class: "text-xs text-[var(--text-secondary)] px-4 -mt-1" }, "Raw checklist completion, not a weighted score. Numeric scoring is not shown because the dataset's calibration is not yet complete."),
      ]),

      detailsSection({
        title: "Category summary",
        count: report.categorySummaries.length,
        children: report.categorySummaries.map((cat) => el("div", { class: "flex justify-between text-sm py-1.5 border-b border-[var(--border)] last:border-0" }, [
          el("span", {}, cat.name),
          el("span", { class: "text-[var(--text-secondary)]" }, `${cat.completion.completed} done · ${cat.completion.needsAttention} attention · ${cat.completion.notTested} not tested`),
        ])),
      }),

      detailsSection({
        title: "Positive findings",
        count: report.positiveFindings.length,
        children: report.positiveFindings.slice(0, 20).map((f) => findingCard(f, "positive")),
      }),

      detailsSection({
        title: "Unresolved / not tested",
        count: report.unresolvedFindings.length + report.notTestedFindings.length,
        children: [
          el("p", { class: "text-sm text-[var(--text-secondary)]" }, `${report.unresolvedFindings.length} unresolved · ${report.notTestedFindings.length} not tested · ${report.unavailableFindings.length} unavailable`),
        ],
      }),

      report.confidenceLimitations.length
        ? detailsSection({
            title: "Result limitations",
            count: report.confidenceLimitations.length,
            children: report.confidenceLimitations.map((l) => el("p", { class: "text-sm text-[var(--warning)]" }, l)),
          })
        : null,

      detailsSection({ title: "Sources", count: report.sourceSnapshots.length, children: [sourceList(report.sourceSnapshots)] }),

      detailsSection({
        title: "Methodology & versions",
        children: [
          ...report.methodologyNotes.map((n) => el("p", { class: "text-sm text-[var(--text-secondary)]" }, n)),
          el("p", { class: "text-xs text-[var(--text-secondary)] mt-2" }, `Dataset ${report.datasetVersion} · app ${report.appVersion}`),
        ],
      }),

      section("Disclaimer", [
        el("p", { class: "text-sm" }, report.disclaimer.reportDisclaimer),
        el("p", { class: "text-xs italic text-[var(--text-secondary)] mt-2" }, report.disclaimer.persistentLabel),
      ]),

      el("div", { class: "no-print" }, [button({ label: "Print / Save as PDF", variant: "secondary", onClick: () => window.print() })]),
    ]),
  );

  // <details> sections default closed to keep the report scannable, but a
  // saved PDF should still contain everything — force them open for the
  // duration of the print and restore whatever the reader had open/closed.
  let previouslyOpen = null;
  function handleBeforePrint() {
    const detailsEls = [...body.querySelectorAll("details")];
    previouslyOpen = detailsEls.map((d) => d.open);
    detailsEls.forEach((d) => { d.open = true; });
  }
  function handleAfterPrint() {
    if (!previouslyOpen) return;
    [...body.querySelectorAll("details")].forEach((d, i) => { d.open = previouslyOpen[i] ?? d.open; });
    previouslyOpen = null;
  }
  window.addEventListener("beforeprint", handleBeforePrint);
  window.addEventListener("afterprint", handleAfterPrint);

  return () => {
    window.removeEventListener("beforeprint", handleBeforePrint);
    window.removeEventListener("afterprint", handleAfterPrint);
  };
}

function summaryBanner({ hasStopCondition, resetIncomplete, hasAdverse, adverseCount }) {
  if (hasStopCondition) {
    return banner("danger", "A stop condition was identified. See below before proceeding.");
  }
  if (hasAdverse) {
    return banner("warning", `${adverseCount} check${adverseCount === 1 ? "" : "s"} need${adverseCount === 1 ? "s" : ""} attention.`);
  }
  if (resetIncomplete) {
    return banner("warning", "No critical issue was identified in the completed checks, but final reset verification is still outstanding.");
  }
  return banner("success", "No critical issue was identified in the completed checks.");
}

// Printed/saved-as-PDF output only — a plain title/back button reading
// "Report" (the on-screen appHeader) means little once separated from the
// app, so a saved PDF instead opens with a proper letterhead: who produced
// it, the standing disclaimer, and exactly when it was generated.
function letterhead(report) {
  return el("div", { class: "hidden print:block mb-6 pb-4 border-b-2 border-[var(--text-primary)]" }, [
    el("p", { class: "text-xl font-bold" }, "Inspectra"),
    el("p", { class: "text-xs text-[var(--text-secondary)] mt-0.5" }, report.disclaimer.persistentLabel),
    el("p", { class: "text-xs text-[var(--text-secondary)]" }, `Generated ${formatDateTime(report.generatedAt)}`),
  ]);
}

const BANNER_STYLE = {
  danger: "bg-red-50 border-red-300 text-[var(--danger)]",
  warning: "bg-amber-50 border-amber-300 text-[var(--warning)]",
  success: "bg-green-50 border-green-300 text-[var(--success)]",
};

function banner(tone, message) {
  return el("div", { class: `rounded-2xl border p-4 font-medium text-sm ${BANNER_STYLE[tone]}` }, message);
}

function section(title, children) {
  return el("section", { class: "border-t border-[var(--border)] pt-5" }, [
    title ? el("h3", { class: "text-base font-semibold mb-2" }, title) : null,
    el("div", { class: "space-y-2" }, children),
  ]);
}

// Secondary/backup detail — present in full (section 32's reporting
// contract requires it), but collapsed by default so the report reads as a
// short, scannable summary rather than one long dense page. Always fully
// expanded in a printed/saved PDF regardless of on-screen state.
function detailsSection({ title, count, children }) {
  const label = count != null ? `${title} (${count})` : title;
  return el("details", { class: "report-details border-t border-[var(--border)] pt-5" }, [
    el(
      "summary",
      { class: "cursor-pointer select-none marker:text-[var(--text-secondary)]" },
      [el("h3", { class: "inline text-base font-semibold" }, label)],
    ),
    el("div", { class: "space-y-2 mt-3" }, children),
  ]);
}
