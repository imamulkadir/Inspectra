import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { bottomActionBar } from "../components/bottomActionBar.js";
import { button } from "../components/button.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { store } from "../core/state.js";
import { getInspectionCatalog } from "../data/catalog.js";
import { nowIso } from "../utils/dates.js";

export async function mountPage(root) {
  const page = el("div", { id: "main", class: "pb-28" }, [
    appHeader({ title: "Before you begin", onBack: () => router.navigate(ROUTES.identify) }),
    el("div", { id: "disclaimer-body", class: "md:max-w-2xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 8 })])]),
  ]);
  mount(root, page);

  const { identification } = store.getState();
  if (!identification.device) {
    router.navigate(ROUTES.identify);
    return () => {};
  }

  let catalog;
  try {
    catalog = await getInspectionCatalog();
  } catch (error) {
    mount(root.querySelector("#disclaimer-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  const disclaimers = catalog.disclaimers;
  let accepted = false;

  function acceptAndContinue() {
    store.setState((prev) => ({
      inspection: {
        ...prev.inspection,
        disclaimerAcceptance: {
          accepted: true,
          acceptedAt: nowIso(),
          disclaimerVersion: disclaimers.version,
        },
      },
    }));
    router.navigate(ROUTES.inspectionNew);
  }

  // Neither the checkbox nor a bare page body submits a <form> on Enter, so
  // without this, checking the box then pressing Enter (the natural next
  // action) does nothing until the user reaches for the fixed bottom button.
  function handleKeydown(event) {
    if (event.key !== "Enter" || !accepted) return;
    if (event.target.tagName === "A" || event.target.tagName === "BUTTON") return;
    event.preventDefault();
    acceptAndContinue();
  }
  document.addEventListener("keydown", handleKeydown);

  const body = root.querySelector("#disclaimer-body");
  clear(body);
  body.appendChild(
    el("div", { class: "px-4 py-4 space-y-5" }, [
      el("p", { class: "text-[15px] leading-relaxed" }, disclaimers.preInspectionAcknowledgement),
      el("div", { class: "rounded-2xl bg-[var(--surface)] p-4 space-y-2" }, [
        el("h2", { class: "text-sm font-semibold" }, "Scope limitations"),
        el(
          "ul",
          { class: "space-y-1.5 list-disc pl-4" },
          (disclaimers.scopeLimitations ?? []).map((item) => el("li", { class: "text-sm text-[var(--text-secondary)]" }, item)),
        ),
      ]),
      el("div", { class: "flex gap-4 text-sm" }, [
        el("a", { href: "#/privacy", class: "text-[var(--accent)] underline" }, "Privacy notice"),
        el("a", { href: "#/terms", class: "text-[var(--accent)] underline" }, "Terms"),
      ]),
      el(
        "label",
        { class: "flex items-start gap-3 rounded-2xl border border-[var(--border)] p-4" },
        [
          el("input", {
            type: "checkbox",
            checked: false,
            class: "mt-1 w-5 h-5",
            onchange: (event) => {
              accepted = event.target.checked;
              renderActionBar();
            },
          }),
          el("span", { class: "text-sm" }, "I have read and understand this acknowledgement, including that Inspectra provides an analytical assessment and not a guarantee."),
        ],
      ),
    ]),
  );

  function renderActionBar() {
    root.querySelector("#disclaimer-actionbar")?.remove();
    const bar = bottomActionBar([
      button({
        label: "Accept and continue",
        disabled: !accepted,
        onClick: acceptAndContinue,
      }),
    ]);
    bar.id = "disclaimer-actionbar";
    root.appendChild(bar);
  }

  renderActionBar();
  return () => {
    document.removeEventListener("keydown", handleKeydown);
  };
}
