import "./styles.css";
import { router } from "./core/router.js";
import { store } from "./core/state.js";
import { installGlobalErrorHandlers, renderFatalError } from "./core/errorBoundary.js";
import { checkDatasetHealth } from "./data/datasetGuard.js";
import { loadLocalization } from "./data/repository.js";
import { ROUTE_TABLE } from "./config/routes.js";
import { APP_STATUS } from "./core/constants.js";
import { dataError } from "./components/dataError.js";
import { el, mount } from "./utils/dom.js";

const appRoot = document.getElementById("app");

installGlobalErrorHandlers((error) => {
  renderFatalError(appRoot, {
    title: "Something went wrong",
    message: error?.message ?? "An unexpected error occurred. Reloading may help.",
    retry: () => location.reload(),
  });
});

function registerRoutes() {
  for (const [pattern, loader] of ROUTE_TABLE) {
    router.register(pattern, async ({ params, query }) => {
      const mod = await loader();
      return mod.mountPage(appRoot, { params, query });
    });
  }
  router.setNotFound(async ({ params, query }) => {
    const mod = await import("./pages/notFoundPage.js");
    return mod.mountPage(appRoot, { params, query });
  });
}

async function boot() {
  mount(appRoot, el("div", { class: "min-h-dvh flex items-center justify-center" }, [el("p", { class: "text-[var(--text-secondary)] text-sm" }, "Loading Inspectra…")]));

  try {
    const { manifest, validation } = await checkDatasetHealth();
    const localization = await loadLocalization().catch(() => null);

    store.setState((prev) => ({
      dataset: { ...prev.dataset, manifest, validation, loadedFeatures: ["boot"] },
      app: { ...prev.app, status: APP_STATUS.READY },
    }));
    void localization;
  } catch (error) {
    store.setState((prev) => ({
      app: { ...prev.app, status: APP_STATUS.ERROR },
      dataset: { ...prev.dataset, loadErrors: [...prev.dataset.loadErrors, error.message] },
    }));
    mount(appRoot, dataError({ message: error.message, onRetry: () => location.reload() }));
    return;
  }

  registerRoutes();
  router.start();

  window.addEventListener("online", () => store.setState((prev) => ({ app: { ...prev.app, online: true } })));
  window.addEventListener("offline", () => store.setState((prev) => ({ app: { ...prev.app, online: false } })));

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    registerServiceWorker();
  }
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`);

    function handleUpdateFound() {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          store.setState((prev) => ({ app: { ...prev.app, updateAvailable: true } }));
          showUpdatePrompt(registration);
        }
      });
    }

    registration.addEventListener("updatefound", handleUpdateFound);
  } catch (error) {
    console.warn("[Inspectra] Service worker registration failed:", error);
  }
}

function showUpdatePrompt(registration) {
  // Never force-reload mid-inspection (section 23.3) — the user chooses when.
  const banner = el(
    "div",
    { class: "no-print fixed top-0 left-0 right-0 z-40 bg-[var(--text-primary)] text-white text-sm px-4 py-2.5 flex items-center justify-between safe-top" },
    [
      el("span", {}, "An Inspectra update is available."),
      el(
        "button",
        {
          class: "font-semibold underline",
          onclick: () => {
            navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
            registration.waiting?.postMessage("SKIP_WAITING");
          },
        },
        "Update now",
      ),
    ],
  );
  document.body.appendChild(banner);
}

boot();
