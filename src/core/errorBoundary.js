import { el, mount } from "../utils/dom.js";

export class DatasetError extends Error {
  constructor(message, { filePath, status } = {}) {
    super(message);
    this.name = "DatasetError";
    this.filePath = filePath;
    this.status = status;
  }
}

export function renderFatalError(root, { title, message, retry }) {
  mount(
    root,
    el("div", { class: "min-h-dvh flex items-center justify-center px-6 safe-top safe-bottom" }, [
      el("div", { class: "max-w-sm text-center" }, [
        el("h1", { class: "text-xl font-semibold mb-3" }, title),
        el("p", { class: "text-[var(--text-secondary)] mb-6" }, message),
        retry
          ? el(
              "button",
              {
                class:
                  "tap-target w-full rounded-2xl bg-[var(--accent)] text-white font-semibold py-3 px-6",
                onclick: retry,
              },
              "Retry",
            )
          : null,
      ]),
    ]),
  );
}

export function installGlobalErrorHandlers(onFatal) {
  window.addEventListener("error", (event) => {
    console.error("[Inspectra] Unhandled error:", event.error ?? event.message);
    onFatal?.(event.error ?? new Error(String(event.message)));
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Inspectra] Unhandled rejection:", event.reason);
    onFatal?.(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  });
}
