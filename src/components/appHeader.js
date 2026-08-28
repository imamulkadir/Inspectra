import { el } from "../utils/dom.js";

// Mobile-only top bar, shown on every page: the wordmark, top-left. On the
// 3 non-home pages pageTitle/pageDescription add a small page-specific line
// underneath (Home skips these — its own hero heading follows right below).
export function mobileBrandBar({ pageTitle, pageDescription } = {}) {
  return el(
    "div",
    { class: "no-print md:hidden safe-top sticky top-0 z-20 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)]" },
    [
      el("div", { class: "flex items-center h-14 px-4" }, [
        el("span", { class: "[font-family:var(--font-logo)] text-lg font-bold text-[var(--accent)] tracking-tight" }, "Inspectra"),
      ]),
      pageTitle
        ? el("div", { class: "px-4 pb-3" }, [
            el("h1", { class: "text-base font-semibold" }, pageTitle),
            pageDescription ? el("p", { class: "text-xs text-[var(--text-secondary)] mt-0.5" }, pageDescription) : null,
          ])
        : null,
    ],
  );
}

export function appHeader({ title, onBack, right = null }) {
  return el(
    "header",
    { class: "no-print safe-top sticky top-0 z-20 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)]" },
    [
      el("div", { class: "flex items-center justify-between px-4 h-16" }, [
        onBack
          ? el(
              "button",
              { class: "tap-target -ml-2 px-2 flex items-center text-[var(--accent)] font-medium", onclick: onBack, "aria-label": "Back" },
              "‹ Back",
            )
          : el("span", { class: "w-10" }),
        el("h1", { class: "text-base font-semibold truncate" }, title),
        right ?? el("span", { class: "w-10" }),
      ]),
    ],
  );
}
