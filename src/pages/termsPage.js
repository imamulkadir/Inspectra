import { el, mount } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";

// The supplied dataset (legal/disclaimers.json) does not include dedicated
// terms-of-use copy — only a pre-inspection acknowledgement, a report
// disclaimer, and a privacy notice draft. This page states that plainly
// rather than fabricating terms text; the project owner must author and
// legally review real terms before commercial launch (section 4.1).
export async function mountPage(root) {
  mount(
    root,
    el("div", { id: "main", class: "pb-16" }, [
      appHeader({ title: "Terms", onBack: () => history.back() }),
      el("div", { class: "px-4 py-4 space-y-4 md:max-w-2xl md:mx-auto" }, [
        el(
          "p",
          { class: "text-sm text-[var(--text-secondary)]" },
          "Dedicated terms-of-use text is not yet included in the supplied dataset. Inspectra's analytical scope and limitations are described in the pre-inspection acknowledgement and report disclaimer.",
        ),
        el("a", { href: "#/privacy", class: "text-[var(--accent)] underline text-sm" }, "View the privacy notice"),
      ]),
    ]),
  );
  return () => {};
}
