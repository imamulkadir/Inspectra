import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { getInspectionCatalog } from "../data/catalog.js";

export async function mountPage(root) {
  const page = el("div", { id: "main", class: "pb-16" }, [
    appHeader({ title: "Privacy", onBack: () => history.back() }),
    el("div", { id: "privacy-body", class: "md:max-w-2xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 6 })])]),
  ]);
  mount(root, page);

  let catalog;
  try {
    catalog = await getInspectionCatalog();
  } catch (error) {
    mount(root.querySelector("#privacy-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  const body = root.querySelector("#privacy-body");
  clear(body);
  body.appendChild(
    el("div", { class: "px-4 py-4 space-y-4" }, [
      el("p", { class: "text-[15px] leading-relaxed" }, catalog.disclaimers.privacyNoticeDraft),
      catalog.disclaimers.requiresQualifiedLegalReview
        ? el("p", { class: "text-xs text-[var(--text-secondary)] italic" }, "This wording is draft copy per the supplied dataset and requires qualified legal review before commercial launch.")
        : null,
    ]),
  );

  return () => {};
}
