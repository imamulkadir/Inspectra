import { el, mount, clear, svgEl } from "../utils/dom.js";
import { mobileBrandBar } from "../components/appHeader.js";
import { topNavigation, mobileTabBar } from "../components/bottomNavigation.js";
import { emptyState } from "../components/emptyState.js";
import { button } from "../components/button.js";
import { openDialog } from "../components/dialog.js";
import { siteFooter } from "../components/footer.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { listInspections, deleteInspection } from "../storage/inspectionRepository.js";
import { deleteAllEvidenceForInspection } from "../storage/evidenceRepository.js";
import { formatDate } from "../utils/dates.js";

export async function mountPage(root) {
  const page = el("div", { id: "main", class: "pb-20" }, [
    topNavigation(ROUTES.saved),
    mobileBrandBar({
      pageTitle: "Saved inspections",
      pageDescription: "Inspections are stored only on this device.",
    }),
    el("div", { id: "saved-body", class: "md:max-w-2xl md:mx-auto" }),
    el("div", { class: "md:max-w-2xl md:mx-auto" }, [siteFooter()]),
    mobileTabBar(ROUTES.saved),
  ]);
  mount(root, page);

  async function render() {
    const body = root.querySelector("#saved-body");
    clear(body);

    const inspections = (await listInspections().catch(() => [])).sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    if (!inspections.length) {
      body.appendChild(
        emptyState({
          title: "No saved inspections yet",
          message: "Inspections are stored only on this device.",
          action: button({ label: "Start an inspection", full: false, onClick: () => router.navigate(ROUTES.identify) }),
        }),
      );
      return;
    }

    body.appendChild(
      el(
        "div",
        { class: "px-4 py-4 space-y-3" },
        inspections.map((inspection) => card(inspection)),
      ),
    );
  }

  function card(inspection) {
    const total = new Set([...inspection.orderedRuleIds, ...(inspection.followUpRuleIds ?? [])]).size;
    const done = Object.keys(inspection.answers ?? {}).length;

    return el("div", { class: "rounded-2xl border border-[var(--border)] p-4" }, [
      el("div", { class: "flex justify-between items-start mb-1" }, [
        el("p", { class: "font-semibold" }, inspection.context?.device?.marketingName ?? "Unknown device"),
        el("span", { class: "text-xs text-[var(--text-secondary)]" }, formatDate(inspection.updatedAt)),
      ]),
      el("p", { class: "text-sm text-[var(--text-secondary)] mb-3" }, `${inspection.profileId} · ${done}/${total} answered${inspection.completedAt ? " · complete" : ""}`),
      el("div", { class: "flex gap-2" }, [
        iconButton({
          label: inspection.completedAt ? "View report" : "Continue",
          icon: inspection.completedAt ? ICON_VIEW : ICON_CONTINUE,
          onClick: () => router.navigate(inspection.completedAt ? ROUTES.report(inspection.id) : ROUTES.inspection(inspection.id)),
        }),
        iconButton({
          label: "Delete",
          icon: ICON_DELETE,
          destructive: true,
          onClick: () =>
            openDialog({
              title: "Delete this inspection?",
              message: "This permanently removes the inspection and all evidence stored on this device.",
              confirmLabel: "Delete",
              destructive: true,
              onConfirm: async () => {
                await deleteAllEvidenceForInspection(inspection.id);
                await deleteInspection(inspection.id);
                render();
              },
            }),
        }),
      ]),
    ]);
  }

  render();
  return () => {};
}

function icon(paths) {
  return svgEl(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round", class: "w-full h-full", "aria-hidden": "true" },
    paths.map((d) => svgEl("path", { d })),
  );
}

const ICON_VIEW = () => icon(["M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"]);
const ICON_CONTINUE = () => icon(["M8 5v14l11-7Z"]);
const ICON_DELETE = () => icon(["M4 7h16", "M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3", "M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13", "M10 11v6", "M14 11v6"]);

// Icon-only, since a repeated row of "View report" / "Continue" / "Delete"
// text buttons per card reads noisier than the icon conveys once its
// meaning is established — an aria-label/title keep the action's exact
// name available to screen readers and on hover.
function iconButton({ label, icon: iconFn, onClick, destructive = false }) {
  return el(
    "button",
    {
      type: "button",
      class: `tap-target rounded-full border p-2.5 ${destructive ? "border-red-200 text-[var(--danger)] hover:bg-red-50" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]"}`,
      "aria-label": label,
      title: label,
      onclick: onClick,
    },
    [el("span", { class: "block w-5 h-5" }, [iconFn()])],
  );
}
