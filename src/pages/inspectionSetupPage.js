import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { bottomActionBar } from "../components/bottomActionBar.js";
import { button } from "../components/button.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { formatStorage } from "../utils/formatting.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { store } from "../core/state.js";
import { getInspectionCatalog } from "../data/catalog.js";
import { buildRuleQueue } from "../engines/ruleResolver.js";
import { INSPECTION_PROFILES, DEFAULT_PROFILE_ID } from "../config/inspectionProfiles.js";
import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/dates.js";
import { saveInspection, listInspections } from "../storage/inspectionRepository.js";

export async function mountPage(root) {
  const page = el("div", { id: "main", class: "pb-28" }, [
    appHeader({ title: "Inspection setup", onBack: () => router.navigate(ROUTES.disclaimer) }),
    el("div", { id: "setup-body", class: "md:max-w-2xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 8 })])]),
  ]);
  mount(root, page);

  const state = store.getState();
  const { identification, inspection } = state;

  if (!identification.device || !inspection.disclaimerAcceptance?.accepted) {
    router.navigate(ROUTES.identify);
    return () => {};
  }

  let catalog;
  try {
    catalog = await getInspectionCatalog();
  } catch (error) {
    mount(root.querySelector("#setup-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  let selectedProfile = DEFAULT_PROFILE_ID;
  const existingInspections = (await listInspections().catch(() => [])).filter(
    (record) => record.context?.deviceId === identification.device.id && !record.completedAt,
  );

  // Phase A (main inspection) and Phase B (final reset verification) are
  // deliberately separate flows (section 21) — reset_activation rules are
  // split out of the main queue here and answered on resetVerificationPage,
  // so step counts shown per profile reflect the main checklist only.
  const mainRules = catalog.rules.filter((rule) => rule.categoryId !== "reset_activation");
  const resetRules = catalog.rules.filter((rule) => rule.categoryId === "reset_activation");

  const profileStepCounts = Object.fromEntries(
    Object.values(INSPECTION_PROFILES).map((profile) => [
      profile.id,
      buildRuleQueue({ rules: mainRules, context: identification.context, profileId: profile.id, categoryById: catalog.categoryById }).orderedRuleIds.length,
    ]),
  );

  function render() {
    const body = root.querySelector("#setup-body");
    clear(body);

    body.appendChild(
      el("div", { class: "px-4 py-4 space-y-5" }, [
        el("div", { class: "rounded-2xl border border-[var(--border)] p-4 space-y-1.5 text-sm" }, [
          el("p", { class: "font-semibold text-base mb-1" }, identification.device.marketingName),
          identification.variant ? el("p", { class: "text-[var(--text-secondary)]" }, identification.variant.marketGroupLabel) : null,
          identification.storage ? el("p", { class: "text-[var(--text-secondary)]" }, `Storage: ${formatStorage(identification.storage)}`) : null,
          identification.finish ? el("p", { class: "text-[var(--text-secondary)]" }, `Finish: ${identification.finish}`) : null,
          identification.iosVersion ? el("p", { class: "text-[var(--text-secondary)]" }, `iOS: ${identification.iosVersion}`) : null,
        ]),

        identification.identityInconsistencies.length
          ? el("div", { class: "rounded-2xl bg-red-50 border border-red-200 p-4" }, [
              el("p", { class: "text-sm font-semibold text-[var(--danger)] mb-1" }, `${identification.identityInconsistencies.length} identity inconsistency flagged`),
              el("p", { class: "text-sm text-[var(--danger)]" }, "This will be highlighted throughout the inspection and the final report."),
            ])
          : null,

        existingInspections.length
          ? el("div", { class: "rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2" }, [
              el("p", { class: "text-sm font-semibold text-[var(--warning)]" }, "An inspection for this model is already in progress."),
              button({ label: "Resume existing inspection", variant: "secondary", onClick: () => router.navigate(ROUTES.inspection(existingInspections[0].id)) }),
            ])
          : null,

        el("div", {}, [
          el("h2", { class: "text-base font-semibold mb-1" }, "Inspection depth"),
          el("p", { class: "text-sm text-[var(--text-secondary)] mb-3" }, "This affects breadth, not certainty: every profile applies the same analytical standard."),
          el(
            "div",
            { class: "grid gap-2.5" },
            Object.values(INSPECTION_PROFILES).map((profile) =>
              el(
                "button",
                {
                  type: "button",
                  class: `tap-target text-left rounded-2xl border px-4 py-3.5 ${selectedProfile === profile.id ? "border-[var(--accent)] bg-blue-50" : "border-[var(--border)]"}`,
                  onclick: () => { selectedProfile = profile.id; render(); },
                },
                [
                  el("p", { class: "font-semibold" }, `${profile.label} (${profileStepCounts[profile.id]} step${profileStepCounts[profile.id] === 1 ? "" : "s"})`),
                  el("p", { class: "text-sm text-[var(--text-secondary)]" }, profile.description),
                ],
              ),
            ),
          ),
        ]),
      ]),
    );

    renderActionBar();
  }

  function renderActionBar() {
    root.querySelector("#setup-actionbar")?.remove();
    const bar = bottomActionBar([button({ label: "Start inspection", onClick: startInspection })]);
    bar.id = "setup-actionbar";
    root.appendChild(bar);
  }

  async function startInspection() {
    const { orderedRuleIds } = buildRuleQueue({
      rules: mainRules,
      context: identification.context,
      profileId: selectedProfile,
      categoryById: catalog.categoryById,
    });
    const { orderedRuleIds: resetRuleIds } = buildRuleQueue({
      rules: resetRules,
      context: identification.context,
      profileId: selectedProfile,
      categoryById: catalog.categoryById,
    });

    const record = {
      id: createId("inspection"),
      profileId: selectedProfile,
      datasetVersion: catalog.manifest?.version ?? null,
      policyVersions: {
        scoring: catalog.scoringPolicy?.version,
        risk: catalog.riskPolicy?.version,
        coverage: catalog.coveragePolicy?.version,
      },
      disclaimerAcceptance: inspection.disclaimerAcceptance,
      context: identification.context,
      identificationSnapshot: identification,
      orderedRuleIds,
      resetRuleIds,
      currentRuleIndex: 0,
      answers: {},
      findings: [],
      identityFindings: identification.identityInconsistencies,
      resetVerification: {},
      startedAt: nowIso(),
      updatedAt: nowIso(),
      completedAt: null,
    };

    await saveInspection(record);
    store.setState((prev) => ({ inspection: { ...prev.inspection, ...record } }));
    router.navigate(ROUTES.inspection(record.id));
  }

  render();
  return () => {};
}
