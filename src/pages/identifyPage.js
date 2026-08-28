import { el, mount, clear, svgEl } from "../utils/dom.js";
import { mobileBrandBar } from "../components/appHeader.js";
import { bottomActionBar } from "../components/bottomActionBar.js";
import { topNavigation, mobileTabBar } from "../components/bottomNavigation.js";
import { button } from "../components/button.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { formatStorage } from "../utils/formatting.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { store } from "../core/state.js";
import { getIdentificationCatalog } from "../data/catalog.js";
import { resolveByANumber, checkModelANumberConsistency } from "../engines/deviceResolver.js";
import { resolveIosContext } from "../engines/iosResolver.js";
import { buildInspectionContext } from "../engines/contextResolver.js";
import {
  anomalyFromModelANumberMismatch,
  anomalyFromStorageObservation,
  anomalyFromFinishObservation,
} from "../engines/anomalyEngine.js";
import { parseVersion } from "../utils/version.js";
import { announce } from "../utils/accessibility.js";
import { bindEnterToContinue } from "../utils/continueOnEnter.js";

const STEP_LABELS = ["Identify", "Storage", "Finish", "iOS version", "Review"];

const ICON_BACK = () =>
  svgEl(
    "svg",
    { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.75", "stroke-linecap": "round", "stroke-linejoin": "round", class: "w-full h-full", "aria-hidden": "true" },
    [svgEl("path", { d: "M15 5 8 12l7 7" })],
  );

export async function mountPage(root) {
  const wizard = {
    step: 0,
    device: null,
    variant: null,
    aNumberResolution: null,
    aNumberInput: "",
    storage: null,
    storageOther: false,
    storageUnableToVerify: false,
    finish: null,
    finishOther: false,
    finishUnableToVerify: false,
    iosVersionInput: "",
    modelSearch: "",
    error: null,
  };

  const page = el("div", { id: "main", class: "pb-40" }, [
    topNavigation(ROUTES.identify),
    mobileBrandBar({
      pageTitle: "Identify this iPhone",
      pageDescription: "Confirm the exact model before starting the inspection.",
    }),
    el("div", { id: "identify-body", class: "max-w-2xl mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 6 })])]),
  ]);
  mount(root, page);

  function handleBack() {
    if (wizard.step > 0) goToStep(wizard.step - 1);
    else router.navigate(ROUTES.home);
  }

  let unbindEnter = null;

  let catalog;
  try {
    catalog = await getIdentificationCatalog();
  } catch (error) {
    mount(root.querySelector("#identify-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  function goToStep(step) {
    wizard.step = step;
    wizard.error = null;
    render();
  }

  function render() {
    const body = root.querySelector("#identify-body");
    if (!body) return;
    clear(body);

    body.appendChild(stepIndicator(wizard.step));

    if (wizard.step === 0) body.appendChild(renderIdentifyStep());
    else if (wizard.step === 1) body.appendChild(renderStorageStep());
    else if (wizard.step === 2) body.appendChild(renderFinishStep());
    else if (wizard.step === 3) body.appendChild(renderIosStep());
    else body.appendChild(renderReviewStep());

    renderActionBar();
  }

  function renderActionBar() {
    let stack = root.querySelector("#identify-bottom-stack");
    if (stack) stack.remove();

    const canContinue = stepIsComplete();
    unbindEnter?.();
    unbindEnter = bindEnterToContinue(() => canContinue, handleContinue);
    stack = el("div", { id: "identify-bottom-stack", class: "no-print safe-bottom fixed bottom-0 left-0 right-0 z-20" }, [
      bottomActionBar(
        [
          button({
            label: wizard.step === STEP_LABELS.length - 1 ? "Continue to disclaimer" : "Continue",
            disabled: !canContinue,
            onClick: handleContinue,
          }),
        ],
        { fixed: false },
      ),
      mobileTabBar(ROUTES.identify, { fixed: false }),
    ]);
    root.appendChild(stack);
  }

  function stepIsComplete() {
    if (wizard.step === 0) return Boolean(wizard.device);
    if (wizard.step === 1) return wizard.storage != null || wizard.storageOther || wizard.storageUnableToVerify;
    if (wizard.step === 2) return wizard.finish != null || wizard.finishOther || wizard.finishUnableToVerify;
    if (wizard.step === 3) return iosVersionValid();
    return true;
  }

  function handleContinue() {
    if (wizard.step < STEP_LABELS.length - 1) {
      goToStep(wizard.step + 1);
      announce(`Step ${wizard.step + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[wizard.step]}`);
      return;
    }
    finalize();
  }

  // Step 0 renders its search input and scrollable model list as DOM nodes
  // that persist across a selection/search — replacing only their contents
  // in place. Rebuilding those nodes from scratch on every keystroke/click
  // (as a full render() would) drops input focus mid-type and resets the
  // list's scroll position back to the top.
  let step0Refs = null;
  let modelSearchDebounce = null;

  function modelButtonLabelClass(deviceId) {
    return `tap-target w-full text-left rounded-2xl border px-4 py-3 ${wizard.device?.id === deviceId ? "border-[var(--accent)] bg-blue-50" : "border-[var(--border)]"}`;
  }

  function renderModelListItems(listEl) {
    clear(listEl);
    catalog.devices
      .filter((d) => d.marketingName.toLowerCase().includes(wizard.modelSearch.toLowerCase()))
      .forEach((device) => {
        listEl.appendChild(
          el(
            "button",
            {
              type: "button",
              class: modelButtonLabelClass(device.id),
              dataset: { deviceId: device.id },
              onclick: () => selectModel(device),
            },
            `${device.marketingName} (${device.introducedYear})`,
          ),
        );
      });
  }

  function updateErrorText() {
    if (!step0Refs) return;
    step0Refs.errorEl.textContent = wizard.error ?? "";
    step0Refs.errorEl.hidden = !wizard.error;
  }

  function updateResolvedCard() {
    if (!step0Refs) return;
    clear(step0Refs.resolvedCardHolder);
    const card = wizard.device && wizard.aNumberResolution?.resolved ? resolvedDeviceCard(wizard.device, "Resolved from A-number") : null;
    if (card) step0Refs.resolvedCardHolder.appendChild(card);
  }

  function selectModel(device) {
    wizard.device = device;
    const consistency = checkModelANumberConsistency(device, wizard.aNumberResolution);
    wizard.error = consistency && !consistency.consistent ? consistency.message : null;
    // Patch each button's classes in place rather than clearing/rebuilding
    // the list: removing and re-adding children can reset the container's
    // scrollTop, which visually snaps the list back to the top the moment
    // a user picks a model further down.
    if (step0Refs) {
      [...step0Refs.modelListEl.children].forEach((btn) => {
        btn.className = modelButtonLabelClass(btn.dataset.deviceId);
      });
    }
    updateErrorText();
    updateResolvedCard();
    renderActionBar();
  }

  function renderIdentifyStep() {
    const errorEl = el("p", { class: "text-sm text-[var(--danger)] mt-2" }, wizard.error ?? "");
    errorEl.hidden = !wizard.error;

    const resolvedCardHolder = el("div", {});

    const modelListEl = el("div", { class: "space-y-2 max-h-72 overflow-y-auto pr-1" });

    step0Refs = { errorEl, resolvedCardHolder, modelListEl };
    renderModelListItems(modelListEl);
    updateResolvedCard();

    function doLookup() {
      const result = resolveByANumber(wizard.aNumberInput, catalog);
      wizard.aNumberResolution = result;
      if (result.resolved) {
        wizard.device = result.device;
        wizard.variant = result.variant;
        wizard.error = null;
      } else {
        wizard.error =
          result.reason === "INVALID_FORMAT"
            ? "Enter a valid A-number, such as A2894."
            : "This A-number was not found in the current dataset. It is not necessarily fake. Mark it unresolved and continue by selecting the model manually.";
      }
      renderModelListItems(modelListEl);
      updateErrorText();
      updateResolvedCard();
      renderActionBar();
    }

    return el("div", { class: "px-4 py-4 space-y-6" }, [
      el("div", {}, [
        el("h2", { class: "text-base font-semibold mb-2" }, "Enter the Apple model number (A-number)"),
        el("p", { class: "text-sm text-[var(--text-secondary)] mb-3" }, "Found in Settings > General > About, or on the SIM tray."),
        el("div", { class: "flex flex-col sm:flex-row gap-2" }, [
          el("input", {
            type: "text",
            value: wizard.aNumberInput,
            placeholder: "A2894",
            class: "tap-target flex-1 rounded-2xl border border-[var(--border)] px-4 py-3 font-mono uppercase",
            oninput: (e) => { wizard.aNumberInput = e.target.value; },
            onkeydown: (e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              // Stopped here so this Enter only looks up the A-number and
              // doesn't also bubble into the page-level "Enter continues"
              // handler below — a successful lookup would otherwise both
              // resolve the device AND immediately advance to the next step
              // in the same keypress, skipping the chance to check the
              // resolved card first.
              e.stopPropagation();
              doLookup();
            },
          }),
          el("button", {
            type: "button",
            class: "tap-target w-full sm:w-auto rounded-2xl bg-[var(--accent)] text-white px-5 font-semibold",
            onclick: doLookup,
          }, "Look up"),
        ]),
        errorEl,
        resolvedCardHolder,
      ]),

      el("div", {}, [
        el("h2", { class: "text-base font-semibold mb-2" }, "Or select the model directly"),
        el("input", {
          type: "search",
          placeholder: "Search model name",
          value: wizard.modelSearch,
          class: "tap-target w-full rounded-2xl border border-[var(--border)] px-4 py-3 mb-4",
          oninput: (e) => {
            wizard.modelSearch = e.target.value;
            clearTimeout(modelSearchDebounce);
            modelSearchDebounce = setTimeout(() => renderModelListItems(modelListEl), 200);
          },
        }),
        modelListEl,
      ]),
    ]);
  }

  function renderStorageStep() {
    const options = wizard.device?.storageGB ?? [];
    return el("div", { class: "px-4 py-4" }, [
      el("h2", { class: "text-base font-semibold mb-1" }, "Observed storage capacity"),
      el("p", { class: "text-sm text-[var(--text-secondary)] mb-4" }, `Check Settings > General > About on the phone being inspected. Official options for ${wizard.device?.marketingName}:`),
      el("div", { class: "grid gap-2.5" }, [
        ...options.map((gb) =>
          choiceButton(formatStorage(gb), wizard.storage === gb && !wizard.storageOther && !wizard.storageUnableToVerify, () => {
            wizard.storage = gb; wizard.storageOther = false; wizard.storageUnableToVerify = false; render();
          }),
        ),
        choiceButton("Other / does not match", wizard.storageOther, () => {
          wizard.storageOther = true; wizard.storage = null; wizard.storageUnableToVerify = false; render();
        }),
        choiceButton("Unable to verify", wizard.storageUnableToVerify, () => {
          wizard.storageUnableToVerify = true; wizard.storage = null; wizard.storageOther = false; render();
        }),
      ]),
    ]);
  }

  function renderFinishStep() {
    const options = wizard.device?.officialFinishNames ?? [];
    return el("div", { class: "px-4 py-4" }, [
      el("h2", { class: "text-base font-semibold mb-1" }, "Observed exterior finish"),
      el("p", { class: "text-sm text-[var(--text-secondary)] mb-4" }, "Official finish names carry no official color swatch in this dataset."),
      el("div", { class: "grid gap-2.5" }, [
        ...options.map((name) =>
          choiceButton(name, wizard.finish === name && !wizard.finishOther && !wizard.finishUnableToVerify, () => {
            wizard.finish = name; wizard.finishOther = false; wizard.finishUnableToVerify = false; render();
          }),
        ),
        choiceButton("Other / not listed", wizard.finishOther, () => {
          wizard.finishOther = true; wizard.finish = null; wizard.finishUnableToVerify = false; render();
        }),
        choiceButton("Unable to verify", wizard.finishUnableToVerify, () => {
          wizard.finishUnableToVerify = true; wizard.finish = null; wizard.finishOther = false; render();
        }),
      ]),
    ]);
  }

  let iosParseFeedbackEl = null;
  let iosVersionDebounce = null;

  function iosVersionValid() {
    const parsed = parseVersion(wizard.iosVersionInput);
    if (!parsed) return false;
    return resolveIosContext(wizard.iosVersionInput, {
      releases: catalog.releases,
      compatibility: catalog.compatibility,
      deviceId: wizard.device?.id,
    }).plausible;
  }

  function renderIosParseFeedback() {
    if (!iosParseFeedbackEl) return;
    clear(iosParseFeedbackEl);
    const parsed = parseVersion(wizard.iosVersionInput);
    let node = null;
    if (parsed) {
      const plausible = resolveIosContext(wizard.iosVersionInput, {
        releases: catalog.releases,
        compatibility: catalog.compatibility,
        deviceId: wizard.device?.id,
      }).plausible;
      node = plausible
        ? el("p", { class: "text-sm text-[var(--text-secondary)] mt-3" }, `Parsed: ${parsed.major}.${parsed.minor}.${parsed.patch} · ${parsed.channel.replace(/_/g, " ")}`)
        : el("p", { class: "text-sm text-[var(--danger)] mt-3" }, `iOS ${parsed.major} doesn't match any known iPhone software release. Double-check Settings > General > About.`);
    } else if (wizard.iosVersionInput) {
      node = el("p", { class: "text-sm text-[var(--danger)] mt-3" }, "Enter a version starting with a number, e.g. 18.4.");
    }
    if (node) iosParseFeedbackEl.appendChild(node);
  }

  function renderIosStep() {
    iosParseFeedbackEl = el("div", {});
    renderIosParseFeedback();

    return el("div", { class: "px-4 py-4" }, [
      el("h2", { class: "text-base font-semibold mb-1" }, "Installed iOS version"),
      el("p", { class: "text-sm text-[var(--text-secondary)] mb-4" }, "Settings > General > About > iOS Version, or Software Update."),
      el("input", {
        type: "text",
        placeholder: "e.g. 18.4 or 26.1 Developer Beta",
        value: wizard.iosVersionInput,
        class: "tap-target w-full rounded-2xl border border-[var(--border)] px-4 py-3",
        oninput: (e) => {
          wizard.iosVersionInput = e.target.value;
          // Also re-binds the page-level Enter-to-continue handler (see
          // renderActionBar) against the just-typed value immediately, so
          // pressing Enter right after a valid version doesn't need to wait
          // out the parse-feedback debounce below.
          renderActionBar();
          clearTimeout(iosVersionDebounce);
          iosVersionDebounce = setTimeout(renderIosParseFeedback, 300);
        },
      }),
      iosParseFeedbackEl,
    ]);
  }

  function renderReviewStep() {
    const iosContext = resolveIosContext(wizard.iosVersionInput, {
      releases: catalog.releases,
      compatibility: catalog.compatibility,
      deviceId: wizard.device?.id,
    });

    const consistency = checkModelANumberConsistency(wizard.device, wizard.aNumberResolution);
    const anomalies = [
      anomalyFromModelANumberMismatch(consistency),
      anomalyFromStorageObservation({ device: wizard.device, observedStorageGB: wizard.storage, isOther: wizard.storageOther }),
      anomalyFromFinishObservation({ device: wizard.device, observedFinishName: wizard.finish, isOther: wizard.finishOther }),
    ].filter(Boolean);

    return el("div", { class: "px-4 py-4 space-y-5" }, [
      reviewSummaryCard(wizard),
      iosContext.limitations.length
        ? el("div", { class: "rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-1" }, iosContext.limitations.map((l) => el("p", { class: "text-sm text-[var(--warning)]" }, l)))
        : null,
      anomalies.length
        ? el("div", { class: "rounded-2xl bg-red-50 border border-red-200 p-4 space-y-2" }, [
            el("h3", { class: "font-semibold text-sm text-[var(--danger)]" }, "Identity inconsistencies found"),
            ...anomalies.map((a) => el("p", { class: "text-sm" }, a.message)),
          ])
        : el("p", { class: "text-sm text-[var(--text-secondary)]" }, "No identity inconsistency was detected in the completed checks."),
    ]);
  }

  function reviewSummaryCard(w) {
    if (!w.device) return null;
    return el("div", { class: "rounded-2xl border border-[var(--border)] overflow-hidden" }, [
      el("div", { class: "bg-blue-50 p-4" }, [
        el("p", { class: "text-xs font-semibold text-[var(--accent)] mb-1" }, "Model"),
        el("p", { class: "font-semibold" }, w.device.marketingName),
        el("p", { class: "text-sm text-[var(--text-secondary)]" }, `${w.device.family} · ${w.device.introducedYear}`),
      ]),
      el("div", { class: "p-4 space-y-1.5 text-sm border-t border-[var(--border)]" }, [
        el("div", {}, [el("span", { class: "text-[var(--text-secondary)]" }, "Storage: "), w.storageOther ? "Other / does not match" : w.storageUnableToVerify ? "Unable to verify" : formatStorage(w.storage)]),
        el("div", {}, [el("span", { class: "text-[var(--text-secondary)]" }, "Finish: "), w.finishOther ? "Other / not listed" : w.finishUnableToVerify ? "Unable to verify" : w.finish]),
        el("div", {}, [el("span", { class: "text-[var(--text-secondary)]" }, "iOS: "), w.iosVersionInput]),
        w.variant ? el("div", {}, [el("span", { class: "text-[var(--text-secondary)]" }, "Market group: "), w.variant.marketGroupLabel]) : null,
      ]),
    ]);
  }

  function resolvedDeviceCard(device, label) {
    if (!device) return null;
    return el("div", { class: "mt-3 rounded-2xl border border-[var(--accent)] bg-blue-50 p-4" }, [
      el("p", { class: "text-xs font-semibold text-[var(--accent)] mb-1" }, label),
      el("p", { class: "font-semibold" }, device.marketingName),
      el("p", { class: "text-sm text-[var(--text-secondary)]" }, `${device.family} · ${device.introducedYear}`),
    ]);
  }

  function choiceButton(label, selected, onClick) {
    return el(
      "button",
      {
        type: "button",
        class: `tap-target text-left rounded-2xl border px-4 py-3.5 font-medium ${selected ? "border-[var(--accent)] bg-blue-50 text-[var(--accent)]" : "border-[var(--border)]"}`,
        onclick: onClick,
      },
      label,
    );
  }

  function stepIndicator(step) {
    // The whole row is one back button — not just the chevron icon — so the
    // much larger "Step N of M · Label" text next to it is tappable too,
    // instead of requiring a precise tap on the small icon alone.
    return el(
      "div",
      { class: "px-2 pt-3 pb-1" },
      [
        el(
          "button",
          {
            type: "button",
            class: "tap-target w-full rounded-xl px-2 py-1.5 -mx-2 flex items-center gap-1 text-left text-[var(--text-secondary)] hover:bg-[var(--surface)]",
            onclick: handleBack,
            "aria-label": `Back. Step ${step + 1} of ${STEP_LABELS.length}, ${STEP_LABELS[step]}.`,
          },
          [
            el("span", { class: "block w-5 h-5 shrink-0", "aria-hidden": "true" }, [ICON_BACK()]),
            el("span", { class: "text-xs font-semibold" }, `Step ${step + 1} of ${STEP_LABELS.length} · ${STEP_LABELS[step]}`),
          ],
        ),
      ],
    );
  }

  function finalize() {
    const iosParsed = parseVersion(wizard.iosVersionInput);
    const consistency = checkModelANumberConsistency(wizard.device, wizard.aNumberResolution);
    const identityInconsistencies = [
      anomalyFromModelANumberMismatch(consistency),
      anomalyFromStorageObservation({ device: wizard.device, observedStorageGB: wizard.storage, isOther: wizard.storageOther }),
      anomalyFromFinishObservation({ device: wizard.device, observedFinishName: wizard.finish, isOther: wizard.finishOther }),
    ].filter(Boolean);

    const capabilitiesRecord = catalog.capabilitiesByDeviceId.get(wizard.device.id) ?? null;

    const context = buildInspectionContext({
      device: wizard.device,
      variant: wizard.variant,
      storage: wizard.storageOther || wizard.storageUnableToVerify ? null : wizard.storage,
      finish: wizard.finishOther || wizard.finishUnableToVerify ? null : wizard.finish,
      iosVersionInput: wizard.iosVersionInput,
      iosParsed,
      capabilitiesRecord,
      identityInconsistencies,
    });

    store.setState((prev) => ({
      identification: {
        ...prev.identification,
        device: wizard.device,
        variant: wizard.variant,
        aNumberInput: wizard.aNumberInput,
        aNumberResolution: wizard.aNumberResolution,
        storage: wizard.storage,
        finish: wizard.finish,
        iosVersion: wizard.iosVersionInput,
        iosParsed,
        identityInconsistencies,
        context,
      },
    }));

    router.navigate(ROUTES.disclaimer);
  }

  render();
  return () => unbindEnter?.();
}
