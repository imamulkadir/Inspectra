import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { button } from "../components/button.js";
import { bottomActionBar } from "../components/bottomActionBar.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { DIAGNOSTIC_STATE } from "../core/constants.js";
import { getInspectionCatalog } from "../data/catalog.js";
import { detectDiagnosticSupport, requiresExplicitMotionPermission } from "../diagnostics/capabilityDetector.js";
import { createDisplayPatternController } from "../diagnostics/displayTest.js";
import { createTouchGridController } from "../diagnostics/touchTest.js";
import { createAudioCueController } from "../diagnostics/audioTest.js";
import { createMicrophoneController } from "../diagnostics/microphoneTest.js";
import { createCameraController } from "../diagnostics/cameraTest.js";
import { createMotionController, requestMotionPermission } from "../diagnostics/motionTest.js";

export async function mountPage(root, { params }) {
  const page = el("div", { id: "main", class: "pb-28" }, [
    appHeader({ title: "Diagnostic", onBack: () => router.navigate(ROUTES.inspection(params.id)) }),
    el("div", { id: "diagnostic-body", class: "md:max-w-2xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 6 })])]),
  ]);
  mount(root, page);

  let catalog;
  try {
    catalog = await getInspectionCatalog();
  } catch (error) {
    mount(root.querySelector("#diagnostic-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  const diagnostic = catalog.diagnosticById.get(params.diagnosticId);
  const body = root.querySelector("#diagnostic-body");

  if (!diagnostic) {
    clear(body);
    body.appendChild(dataError({ message: `Diagnostic "${params.diagnosticId}" was not found in the dataset.` }));
    return () => {};
  }

  let onTargetDevice = null; // null = unanswered, true/false once confirmed
  let cleanupActive = null;

  function renderGate() {
    clear(body);
    body.appendChild(
      el("div", { class: "px-4 py-6 space-y-5" }, [
        el("h2", { class: "text-lg font-semibold" }, "Is this page open on the iPhone being inspected?"),
        el("p", { class: "text-sm text-[var(--text-secondary)]" }, "A browser diagnostic only tests the physical device it runs on. Never attribute a result from your companion phone to the used iPhone."),
        el("div", { class: "grid gap-2.5" }, [
          button({ label: "Yes, this is the used iPhone (target-device mode)", onClick: () => { onTargetDevice = true; render(); } }),
          button({ label: "No, I'm on my companion phone", variant: "secondary", onClick: () => { onTargetDevice = false; render(); } }),
        ]),
      ]),
    );
  }

  function renderHandoff() {
    const url = new URL(`#${ROUTES.diagnostic(params.id, params.diagnosticId)}`, location.href);
    clear(body);
    body.appendChild(
      el("div", { class: "px-4 py-6 space-y-5" }, [
        el("p", { class: "font-semibold" }, "Companion mode"),
        el("p", { class: "text-sm text-[var(--text-secondary)]" }, "Open this exact link on the iPhone being inspected, run the test there, then come back and record what you observed."),
        el("div", { class: "rounded-2xl border border-[var(--border)] p-4 space-y-2" }, [
          el("p", { class: "text-xs text-[var(--text-secondary)]" }, "Diagnostic link"),
          el("p", { class: "font-mono text-sm break-all select-all" }, url.toString()),
        ]),
        button({ label: "I've run it on the used iPhone: record what I observed", variant: "secondary", onClick: () => { onTargetDevice = "manual"; render(); } }),
      ]),
    );
  }

  function renderManualEntry() {
    clear(body);
    body.appendChild(
      el("div", { class: "px-4 py-6 space-y-4" }, [
        el("p", { class: "font-semibold" }, "Manually record what you observed on the used iPhone"),
        el("textarea", { id: "manual-observation", rows: "5", class: "w-full rounded-2xl border border-[var(--border)] p-3", placeholder: "Describe the result you saw on the used iPhone." }),
        el("p", { class: "text-xs text-[var(--text-secondary)]" }, "This will be recorded as a user observation, not a direct browser observation, because it was manually transferred."),
      ]),
    );
    renderActionBar([button({ label: "Back to inspection", onClick: () => router.navigate(ROUTES.inspection(params.id)) })]);
  }

  function renderActionBar(children) {
    root.querySelector("#diagnostic-actionbar")?.remove();
    const bar = bottomActionBar(children);
    bar.id = "diagnostic-actionbar";
    root.appendChild(bar);
  }

  function render() {
    cleanupActive?.();
    cleanupActive = null;

    if (onTargetDevice === null) return renderGate();
    if (onTargetDevice === false) return renderHandoff();
    if (onTargetDevice === "manual") return renderManualEntry();

    const support = detectDiagnosticSupport(diagnostic.id);
    if (support === DIAGNOSTIC_STATE.UNSUPPORTED) {
      clear(body);
      body.appendChild(dataError({ message: "This diagnostic is not supported in this browser. This reflects the browser, not the device's hardware." }));
      return;
    }

    clear(body);
    if (diagnostic.id === "display-patterns") cleanupActive = runDisplayPatterns();
    else if (diagnostic.id === "touch-grid") cleanupActive = runTouchGrid();
    else if (diagnostic.id === "audio-channel-cues") cleanupActive = runAudioCues();
    else if (diagnostic.id === "microphone-record-playback") cleanupActive = runMicrophone();
    else if (diagnostic.id === "camera-preview") cleanupActive = runCamera();
    else if (diagnostic.id === "motion-orientation") cleanupActive = runMotion();
    else body.appendChild(dataError({ message: "This diagnostic type is not yet implemented." }));
  }

  function runDisplayPatterns() {
    const controller = createDisplayPatternController(diagnostic);
    const overlay = el("div", { class: "fixed inset-0 z-50 flex flex-col" });
    const canvas = el("div", { class: "flex-1", style: { background: "#000" } });
    overlay.appendChild(canvas);

    const counter = el("span", { class: "text-white text-sm" }, `${controller.indexOf() + 1} / ${controller.count}`);

    function paint() {
      const pattern = controller.current();
      const description = controller.describe(pattern);
      if (description.kind === "css") canvas.style.background = description.value;
      else canvas.style.background = description.value === "checkerboard"
        ? "repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 0 0 / 40px 40px"
        : "#fff";
      counter.textContent = `${controller.indexOf() + 1} / ${controller.count}`;
    }
    paint();

    overlay.appendChild(
      el("div", { class: "safe-bottom flex items-center justify-between px-4 py-4 bg-black/60" }, [
        button({ label: "‹ Prev", variant: "ghost", full: false, onClick: () => { controller.previous(); paint(); } }),
        counter,
        button({ label: "Next ›", variant: "ghost", full: false, onClick: () => { controller.next(); paint(); } }),
        button({ label: "Exit", variant: "destructive", full: false, onClick: () => { overlay.remove(); render(); } }),
      ]),
    );

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    body.appendChild(el("p", { class: "px-4 py-6 text-sm text-[var(--text-secondary)]" }, diagnostic.disclaimer));

    return () => {
      overlay.remove();
      document.body.style.overflow = "";
    };
  }

  function runTouchGrid() {
    const controller = createTouchGridController({ rows: 6, columns: 4 });
    const grid = el("div", { class: "grid gap-1 p-2", style: { gridTemplateColumns: `repeat(${controller.columns}, 1fr)` } });

    for (let i = 0; i < controller.totalCells; i += 1) {
      const cell = el("div", { class: "aspect-square rounded bg-[var(--surface)]", dataset: { index: String(i) } });
      cell.addEventListener("pointerdown", () => {
        controller.touchCell(i);
        cell.classList.remove("bg-[var(--surface)]");
        cell.classList.add("bg-[var(--accent)]");
        updateStats();
      });
      grid.appendChild(cell);
    }

    const stats = el("p", { class: "px-4 text-sm text-[var(--text-secondary)]" });
    function updateStats() {
      const snap = controller.snapshot();
      stats.textContent = `${snap.touchedCells} / ${snap.totalCells} cells touched`;
    }
    updateStats();

    body.appendChild(el("div", { class: "px-4 py-4" }, [
      el("p", { class: "text-sm text-[var(--text-secondary)] mb-3" }, "Touch every cell. This is a raw coverage observation, not an automatic pass/fail."),
      grid,
      stats,
    ]));

    return () => {};
  }

  function runAudioCues() {
    const controller = createAudioCueController();
    body.appendChild(
      el("div", { class: "px-4 py-6 space-y-3" }, [
        el("p", { class: "text-sm text-[var(--text-secondary)]" }, diagnostic.disclaimer ?? "Generated test tones. Listen for distortion, imbalance, or rattling."),
        el("div", { class: "grid grid-cols-3 gap-2.5" }, [
          button({ label: "Left", variant: "secondary", onClick: () => controller.playCue("left") }),
          button({ label: "Center", variant: "secondary", onClick: () => controller.playCue("center") }),
          button({ label: "Right", variant: "secondary", onClick: () => controller.playCue("right") }),
        ]),
      ]),
    );
    return () => controller.close();
  }

  function runMicrophone() {
    const controller = createMicrophoneController();
    let recording = false;
    let resultUrl = null;

    const status = el("p", { class: "text-sm text-[var(--text-secondary)]" }, "Tap start, speak for a few seconds, then stop.");
    const audioEl = el("audio", { controls: true, class: "w-full hidden" });
    const startBtn = button({ label: "Start recording", onClick: async () => {
      try {
        await controller.start();
        recording = true;
        status.textContent = "Recording…";
      } catch {
        status.textContent = "Microphone permission was denied or unavailable.";
      }
    } });
    const stopBtn = button({ label: "Stop & play back", variant: "secondary", onClick: async () => {
      if (!recording) return;
      const result = await controller.stop();
      recording = false;
      if (result) {
        resultUrl = result.url;
        audioEl.src = result.url;
        audioEl.classList.remove("hidden");
        status.textContent = "Recorded in memory only, not saved unless you attach it as evidence.";
      }
    } });

    body.appendChild(el("div", { class: "px-4 py-6 space-y-4" }, [status, el("div", { class: "flex gap-2.5" }, [startBtn, stopBtn]), audioEl]));

    return () => {
      controller.discard();
      void resultUrl;
    };
  }

  function runCamera() {
    const controller = createCameraController();
    const video = el("video", { autoplay: true, playsinline: true, muted: true, class: "w-full rounded-2xl bg-black aspect-[3/4]" });
    const status = el("p", { class: "text-sm text-[var(--text-secondary)]" }, "Requesting camera…");

    controller.start().then((stream) => {
      video.srcObject = stream;
      status.textContent = "Live preview only. Nothing is captured or saved.";
    }).catch(() => {
      status.textContent = "Camera permission was denied or unavailable.";
    });

    body.appendChild(
      el("div", { class: "px-4 py-6 space-y-4" }, [
        status,
        video,
        button({ label: "Switch camera", variant: "secondary", onClick: async () => { const s = await controller.switchFacing(); video.srcObject = s; } }),
      ]),
    );

    return () => controller.stop();
  }

  function runMotion() {
    const output = el("pre", { class: "text-xs bg-[var(--surface)] rounded-xl p-3 overflow-x-auto" }, "Waiting for motion data…");
    const controller = createMotionController({
      onMotion: (data) => { output.textContent = JSON.stringify(data, null, 2); },
    });

    const start = async () => {
      if (requiresExplicitMotionPermission()) {
        const result = await requestMotionPermission();
        if (result !== "granted") {
          output.textContent = "Motion permission was denied.";
          return;
        }
      }
      controller.start();
    };

    body.appendChild(
      el("div", { class: "px-4 py-6 space-y-4" }, [
        el("p", { class: "text-sm text-[var(--text-secondary)]" }, "Raw sensor event display, not a calibration tool."),
        button({ label: "Start", variant: "secondary", onClick: start }),
        output,
      ]),
    );

    return () => controller.stop();
  }

  render();
  return () => cleanupActive?.();
}
