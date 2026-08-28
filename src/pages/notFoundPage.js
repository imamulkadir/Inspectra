import { el, mount } from "../utils/dom.js";
import { button } from "../components/button.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";

export async function mountPage(root) {
  mount(
    root,
    el("div", { id: "main", class: "min-h-dvh flex items-center justify-center px-6 text-center" }, [
      el("div", {}, [
        el("h1", { class: "text-xl font-semibold mb-2" }, "Page not found"),
        el("p", { class: "text-[var(--text-secondary)] mb-6" }, "That route doesn't exist in Inspectra."),
        button({ label: "Go home", onClick: () => router.navigate(ROUTES.home) }),
      ]),
    ]),
  );
  return () => {};
}
