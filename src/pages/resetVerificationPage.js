import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { bottomActionBar } from "../components/bottomActionBar.js";
import { progressBar } from "../components/progressBar.js";
import { button } from "../components/button.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { questionCard } from "../components/questionCard.js";
import { answerControl } from "../components/answerControl.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { PROVENANCE } from "../core/constants.js";
import { getInspectionCatalog } from "../data/catalog.js";
import { getInspection, saveInspection } from "../storage/inspectionRepository.js";
import { interpretAnswer } from "../engines/answerInterpreter.js";
import { resolveExpectedValue } from "../engines/expectedValueResolver.js";
import { evaluateOfficialStopConditions } from "../engines/riskEngine.js";
import { announce } from "../utils/accessibility.js";
import { nowIso } from "../utils/dates.js";
import { bindEnterToContinue } from "../utils/continueOnEnter.js";

export async function mountPage(root, { params }) {
  const page = el("div", { id: "main", class: "pb-28" }, [
    appHeader({ title: "Final reset verification", onBack: () => router.navigate(ROUTES.inspection(params.id)) }),
    el("div", { id: "reset-body", class: "md:max-w-2xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 6 })])]),
  ]);
  mount(root, page);

  let catalog;
  let record;
  try {
    [catalog, record] = await Promise.all([getInspectionCatalog(), getInspection(params.id)]);
  } catch (error) {
    mount(root.querySelector("#reset-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }
  if (!record) {
    mount(root.querySelector("#reset-body"), dataError({ message: `Inspection "${params.id}" was not found on this device.` }));
    return () => {};
  }

  record.resetRuleIds ??= [];
  let acknowledged = record.resetVerification?.consentAcknowledged === true;
  // Resume at the first unanswered reset/activation question (section 22.2)
  // rather than always restarting at index 0 — otherwise reloading or
  // returning to an in-progress reset verification would re-show questions
  // that were already answered instead of continuing where it left off.
  let currentIndex = record.resetRuleIds.findIndex((id) => !record.answers[id]);
  if (currentIndex === -1) currentIndex = record.resetRuleIds.length;

  let unbindEnter = null;
  function bindEnter(canContinue, onContinue) {
    unbindEnter?.();
    unbindEnter = bindEnterToContinue(canContinue, onContinue);
  }

  async function persist() {
    record.updatedAt = nowIso();
    await saveInspection(record).catch((error) => console.error("[Inspectra] Autosave failed:", error));
  }

  function render() {
    const body = root.querySelector("#reset-body");
    clear(body);

    if (!acknowledged) {
      body.appendChild(renderConsentGate());
      const acknowledge = () => { acknowledged = true; record.resetVerification = { ...record.resetVerification, consentAcknowledged: true }; persist(); render(); };
      bindEnter(() => true, acknowledge);
      renderActionBar([button({ label: "I understand, continue", onClick: acknowledge })]);
      return;
    }

    if (!record.resetRuleIds.length || currentIndex >= record.resetRuleIds.length) {
      body.appendChild(renderSummary());
      bindEnter(() => true, finish);
      renderActionBar([button({ label: "View report", onClick: finish })]);
      return;
    }

    const ruleId = record.resetRuleIds[currentIndex];
    const rule = catalog.ruleById.get(ruleId);
    const answerSet = catalog.answerSetById.get(rule.answerSetId);
    const expectedValue = resolveExpectedValue(rule.expected, record.context);
    const existing = record.answers[ruleId];
    const selection = existing ? { optionId: existing.optionId, value: existing.value, unableToVerify: existing.unableToVerify } : {};

    body.appendChild(progressBar({ current: currentIndex, total: record.resetRuleIds.length, label: "Final reset verification" }));

    const control = answerControl({
      answerSet,
      selection,
      onSelect: (optionId) => { handleAnswer(rule, answerSet, { optionId }); render(); },
      onValueChange: (value) => {
        // A full render() here (like the option/checkbox branches use) would
        // recreate this exact <input> from scratch on every keystroke,
        // destroying its focus after each character typed. Refresh only the
        // action bar instead, and debounce the actual save so it "checks"
        // once typing pauses rather than writing to IndexedDB every keystroke.
        handleAnswer(rule, answerSet, { value }, { debounceSave: true });
        renderQuestionActionBar(ruleId);
      },
      onUnableToVerify: (unableToVerify) => { handleAnswer(rule, answerSet, { unableToVerify }); render(); },
    });

    body.appendChild(questionCard({ rule, category: catalog.categoryById.get(rule.categoryId), expectedValue, answerControlNode: control, sources: [] }));

    const stopConditions = evaluateOfficialStopConditions(catalog.riskPolicy, record.answers);
    if (stopConditions.length) {
      body.insertBefore(stopBanner(stopConditions[0]), body.firstChild);
    }

    renderQuestionActionBar(ruleId);
  }

  // Flushes (rather than discards) a pending debounced save before leaving
  // the question: record already has the latest typed value in memory, but
  // without this a fast Continue/Previous tap right after typing could
  // navigate away before the 500ms debounce ever writes it to IndexedDB.
  function flushPendingSave() {
    if (!saveDebounce) return;
    clearTimeout(saveDebounce);
    saveDebounce = null;
    persist();
  }

  function renderQuestionActionBar(ruleId) {
    const advance = () => { flushPendingSave(); currentIndex += 1; render(); };
    bindEnter(() => Boolean(record.answers[ruleId]), advance);
    renderActionBar([
      currentIndex > 0 ? button({ label: "Previous", variant: "secondary", full: false, onClick: () => { flushPendingSave(); currentIndex -= 1; render(); } }) : null,
      button({ label: "Continue", disabled: !record.answers[ruleId], onClick: advance }),
    ].filter(Boolean));
  }

  let saveDebounce = null;

  function handleAnswer(rule, answerSet, partial, { debounceSave = false } = {}) {
    const interpretation = interpretAnswer(rule, answerSet, partial);
    record.answers[rule.id] = { ...partial, ...interpretation, provenance: PROVENANCE.USER_OBSERVATION, recordedAt: nowIso() };

    clearTimeout(saveDebounce);
    if (debounceSave) {
      saveDebounce = setTimeout(persist, 500);
    } else {
      persist();
    }

    const stopConditions = evaluateOfficialStopConditions(catalog.riskPolicy, record.answers);
    if (stopConditions.length) announce(stopConditions[0].message, { assertive: true });
  }

  function renderConsentGate() {
    return el("div", { class: "px-4 py-6 space-y-4" }, [
      el("div", { class: "rounded-2xl bg-amber-50 border border-amber-200 p-4" }, [
        el("p", { class: "font-semibold text-[var(--warning)] mb-1" }, "This step may involve destructive device actions."),
        el("p", { class: "text-sm text-[var(--warning)]" }, "Only proceed with the seller's consent, and only after the seller has backed up their data. This verifies ownership transfer and activation. It does not itself erase anything you don't confirm on the device."),
      ]),
    ]);
  }

  function renderSummary() {
    const completed = record.resetRuleIds.every((id) => record.answers[id]);
    record.resetVerification = { ...record.resetVerification, completed };
    return el("div", { class: "px-4 py-10 text-center space-y-3" }, [
      el("h2", { class: "text-xl font-semibold" }, completed ? "Final reset verification complete" : "Final reset verification incomplete"),
      !completed
        ? el("p", { class: "text-sm text-[var(--danger)]" }, "Final reset verification was not completed. This will be shown prominently in the report.")
        : el("p", { class: "text-sm text-[var(--text-secondary)]" }, "Ready to view the full report."),
    ]);
  }

  function stopBanner(condition) {
    return el("div", { class: "mx-4 mt-4 rounded-2xl bg-red-50 border border-red-300 p-4", role: "alert" }, [
      el("p", { class: "font-semibold text-[var(--danger)] mb-1" }, `Stop: ${condition.level}`),
      el("p", { class: "text-sm text-[var(--danger)]" }, condition.message),
    ]);
  }

  function renderActionBar(children) {
    root.querySelector("#reset-actionbar")?.remove();
    const bar = bottomActionBar(children);
    bar.id = "reset-actionbar";
    root.appendChild(bar);
  }

  async function finish() {
    record.resetVerification = { ...record.resetVerification, completed: record.resetRuleIds.every((id) => record.answers[id]) };
    record.completedAt = nowIso();
    await persist();
    router.navigate(ROUTES.report(record.id));
  }

  render();
  return () => {
    unbindEnter?.();
    flushPendingSave();
  };
}
