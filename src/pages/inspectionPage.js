import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { bottomActionBar } from "../components/bottomActionBar.js";
import { progressBar } from "../components/progressBar.js";
import { button } from "../components/button.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { questionCard } from "../components/questionCard.js";
import { answerControl } from "../components/answerControl.js";
import { openBottomSheet } from "../components/bottomSheet.js";
import { showToast } from "../components/toast.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { PROVENANCE, RULE_APPLICABILITY, COMPARISON_OUTCOME } from "../core/constants.js";
import { getInspectionCatalog } from "../data/catalog.js";
import { getInspection, saveInspection } from "../storage/inspectionRepository.js";
import { interpretAnswer } from "../engines/answerInterpreter.js";
import { resolveExpectedValue, compareValues } from "../engines/expectedValueResolver.js";
import { resolveNavigationRoute } from "../engines/navigationResolver.js";
import { resolveFollowUps } from "../engines/followUpResolver.js";
import { resolveRuleApplicability } from "../engines/ruleResolver.js";
import { anomalyFromComparison } from "../engines/anomalyEngine.js";
import { announce } from "../utils/accessibility.js";
import { nowIso } from "../utils/dates.js";
import { evaluateOfficialStopConditions } from "../engines/riskEngine.js";
import { bindEnterToContinue } from "../utils/continueOnEnter.js";

export async function mountPage(root, { params }) {
  const page = el("div", { id: "main", class: "pb-28" }, [
    appHeader({ title: "Inspection", onBack: () => router.navigate(ROUTES.saved) }),
    el("div", { id: "inspection-body", class: "md:max-w-2xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 6 })])]),
  ]);
  mount(root, page);

  let catalog;
  let record;
  try {
    [catalog, record] = await Promise.all([getInspectionCatalog(), getInspection(params.id)]);
  } catch (error) {
    mount(root.querySelector("#inspection-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  if (!record) {
    mount(root.querySelector("#inspection-body"), dataError({ message: `Inspection "${params.id}" was not found on this device.` }));
    return () => {};
  }

  record.followUpRuleIds ??= [];
  record.currentRuleId ??= record.orderedRuleIds[0] ?? null;

  let unbindEnter = null;

  function fullSequence() {
    return [...new Set([...record.orderedRuleIds, ...record.followUpRuleIds])];
  }

  async function persist() {
    record.updatedAt = nowIso();
    await saveInspection(record).catch((error) => console.error("[Inspectra] Autosave failed:", error));
    showToast("Saved on this device");
  }

  // Save quietly (no toast) so simply moving between questions doesn't spam
  // the save-status toast on every tap — see persistPosition() below.
  async function persistPosition() {
    record.updatedAt = nowIso();
    await saveInspection(record).catch((error) => console.error("[Inspectra] Autosave failed:", error));
  }

  function render() {
    const sequence = fullSequence();
    const body = root.querySelector("#inspection-body");
    clear(body);

    if (!sequence.length || sequence.every((id) => record.answers[id])) {
      body.appendChild(renderComplete());
      renderActionBar(true);
      return;
    }

    let currentIndex = sequence.indexOf(record.currentRuleId);
    if (currentIndex === -1) currentIndex = sequence.findIndex((id) => !record.answers[id]);
    if (currentIndex === -1) currentIndex = 0;
    record.currentRuleId = sequence[currentIndex];

    const rule = catalog.ruleById.get(record.currentRuleId);
    if (!rule) {
      body.appendChild(dataError({ message: `Rule "${record.currentRuleId}" is missing from the loaded dataset.` }));
      return;
    }

    body.appendChild(progressBar({ current: Object.keys(record.answers).length, total: sequence.length, label: catalog.categoryById.get(rule.categoryId)?.name }));

    const answerSet = catalog.answerSetById.get(rule.answerSetId);
    const category = catalog.categoryById.get(rule.categoryId);
    const expectedValue = resolveExpectedValue(rule.expected, record.context);
    const existingAnswer = record.answers[rule.id];
    const selection = existingAnswer
      ? { optionId: existingAnswer.optionId, value: existingAnswer.value, unableToVerify: existingAnswer.unableToVerify }
      : {};

    const sources = (rule.sourceIds ?? []).map((id) => catalog.sourceById.get(id)).filter(Boolean);

    const control = answerControl({
      answerSet,
      selection,
      onSelect: (optionId) => { handleAnswer(rule, answerSet, { optionId }); render(); },
      onValueChange: (value) => {
        // A full render() here (like the option/checkbox branches use) would
        // recreate this exact <input> from scratch on every keystroke,
        // destroying its focus after each character typed. Refresh only the
        // action bar instead — enough to reflect the now-answered state —
        // and debounce the actual save so it "checks" once typing pauses
        // rather than writing to IndexedDB on every keystroke.
        handleAnswer(rule, answerSet, { value }, { debounceSave: true });
        renderActionBar(false, sequence, currentIndex);
      },
      onUnableToVerify: (unableToVerify) => { handleAnswer(rule, answerSet, { unableToVerify, value: selection.value }); render(); },
    });

    body.appendChild(
      questionCard({
        rule,
        category,
        expectedValue,
        answerControlNode: control,
        sources,
        onHowToCheck: rule.navigationId ? () => showHowToCheck(rule) : null,
      }),
    );

    renderActionBar(false, sequence, currentIndex);
  }

  function showHowToCheck(rule) {
    const { entry, route } = resolveNavigationRoute(rule.navigationId, {
      navigationById: catalog.navigationById,
      device: record.context.device,
      iosParsed: record.context.iosParsed,
      devices: catalog.devices,
    });

    openBottomSheet({
      title: entry?.concept ?? "How to check",
      content: el("div", { class: "space-y-3" }, [
        route
          ? el(
              "p",
              { class: "text-sm font-medium" },
              route.steps.flatMap((step, index) => (index === 0 ? [step] : [el("span", { class: "text-[var(--text-secondary)] mx-1.5" }, "›"), step])),
            )
          : el("p", { class: "text-sm text-[var(--text-secondary)]" }, entry?.fallback ?? "Exact path not verified for this configuration. Try searching Settings for this feature."),
        entry?.absenceNote ? el("p", { class: "text-xs text-[var(--text-secondary)]" }, entry.absenceNote) : null,
      ]),
    });
  }

  let saveDebounce = null;

  function handleAnswer(rule, answerSet, partialSelection, { debounceSave = false } = {}) {
    const interpretation = interpretAnswer(rule, answerSet, partialSelection);
    const provenance = rule.method === "browser_assisted" ? PROVENANCE.BROWSER_OBSERVATION : PROVENANCE.USER_OBSERVATION;

    record.answers[rule.id] = {
      ...partialSelection,
      ...interpretation,
      provenance,
      recordedAt: nowIso(),
    };

    if (rule.expected) {
      const expectedValue = resolveExpectedValue(rule.expected, record.context);
      const observed = partialSelection.value ?? partialSelection.optionId;
      const outcome = compareValues(observed, expectedValue);
      if (outcome === COMPARISON_OUTCOME.MISMATCH) {
        const anomaly = anomalyFromComparison({ rule, observed, expectedValue: expectedValue.value, outcome, provenance });
        if (anomaly && !record.identityFindings.some((f) => f.triggeredRuleIds?.includes(rule.id))) {
          record.identityFindings = [...record.identityFindings, anomaly];
        }
      }
    }

    const { extraRuleIds, triggeredFollowUps } = resolveFollowUps({
      followUps: catalog.followUps,
      answers: record.answers,
      ruleById: catalog.ruleById,
    });

    for (const ruleId of extraRuleIds) {
      if (record.followUpRuleIds.includes(ruleId) || record.orderedRuleIds.includes(ruleId)) continue;
      const applicability = resolveRuleApplicability(catalog.ruleById.get(ruleId), record.context);
      if (applicability.status === RULE_APPLICABILITY.APPLICABLE) {
        record.followUpRuleIds.push(ruleId);
      }
    }
    record.followUpMessages = triggeredFollowUps;

    const stopConditions = evaluateOfficialStopConditions(catalog.riskPolicy, record.answers);
    record.officialStopConditions = stopConditions;

    clearTimeout(saveDebounce);
    if (debounceSave) {
      saveDebounce = setTimeout(persist, 500);
    } else {
      persist();
    }

    if (stopConditions.length) {
      announce(stopConditions[0].message, { assertive: true });
    }
  }

  function goTo(sequence, index) {
    if (index < 0 || index >= sequence.length) return;
    // A debounced save from the just-left question would otherwise still
    // fire ~500ms later, popping its "Saved" toast while a different
    // question is already on screen. The record already has the latest
    // typed value in memory regardless, and persistPosition() below writes
    // that current state immediately, so nothing typed is lost by skipping
    // the now-superfluous pending save.
    clearTimeout(saveDebounce);
    record.currentRuleId = sequence[index];
    // Persist the new position immediately (section 22.2). Without this,
    // reloading or navigating away right after "Continue" — before
    // answering the next question — would resume on the previous,
    // already-answered question instead of the one actually being shown,
    // since currentRuleId would otherwise only reach IndexedDB as a stale
    // side-effect of the *next* answer's autosave. This is deliberately
    // fire-and-forget (not awaited before render()): rendering stays
    // synchronous with the click so rapid navigation can never have two
    // renders racing/interleaving, and a background write of a few
    // milliseconds is not something a real reload can outrun.
    persistPosition();
    render();
  }

  function renderComplete() {
    return el("div", { class: "px-4 py-10 text-center space-y-4" }, [
      el("h2", { class: "text-xl font-semibold" }, "Main inspection complete"),
      el("p", { class: "text-[var(--text-secondary)]" }, "Continue to final reset verification before payment, or view the report now."),
    ]);
  }

  function renderActionBar(isComplete, sequence, currentIndex) {
    root.querySelector("#inspection-actionbar")?.remove();

    const canGoBack = !isComplete && currentIndex > 0;
    const rule = !isComplete ? catalog.ruleById.get(record.currentRuleId) : null;
    const answered = rule ? Boolean(record.answers[rule.id]) : false;

    unbindEnter?.();
    unbindEnter = bindEnterToContinue(
      () => (isComplete ? true : answered),
      () => {
        if (isComplete) router.navigate(ROUTES.inspectionReset(record.id));
        else if (currentIndex === sequence.length - 1) render();
        else goTo(sequence, currentIndex + 1);
      },
    );

    const children = [];
    if (canGoBack) {
      children.push(button({ label: "Previous", variant: "secondary", onClick: () => goTo(sequence, currentIndex - 1) }));
    }

    if (isComplete) {
      children.push(button({ label: "Final reset verification", onClick: () => router.navigate(ROUTES.inspectionReset(record.id)) }));
    } else {
      children.push(
        button({
          label: currentIndex === sequence.length - 1 && record.answers[rule.id] ? "Finish" : "Continue",
          disabled: !answered,
          onClick: () => (currentIndex === sequence.length - 1 ? render() : goTo(sequence, currentIndex + 1)),
        }),
      );
    }

    const bar = bottomActionBar(children);
    bar.id = "inspection-actionbar";
    root.appendChild(bar);
  }

  render();
  return () => {
    unbindEnter?.();
    // Flush rather than discard: navigating away (e.g. the header's own
    // Back button, which doesn't go through goTo()/persistPosition()) can
    // happen inside the debounce window, and record already has the
    // just-typed value in memory — losing that would be a real answer
    // silently not saved, not just a redundant toast.
    if (saveDebounce) {
      clearTimeout(saveDebounce);
      persist();
    }
  };
}
