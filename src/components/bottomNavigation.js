import { el, svgEl } from "../utils/dom.js";
import { ROUTES } from "../config/routes.js";
import { router } from "../core/router.js";

function icon(paths, viewBox = "0 0 24 24") {
  return svgEl(
    "svg",
    {
      viewBox,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.75",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "w-full h-full",
      "aria-hidden": "true",
    },
    paths.map((d) => svgEl("path", { d })),
  );
}

// Simple hand-drawn line icons matching the app's rounded, Apple-inspired
// visual language (section 25) — the previous set (⌂▤◎☰) mixed unrelated
// glyph styles from the system emoji/symbol font and looked inconsistent.
const ICONS = {
  home: () =>
    icon(["M4 11.5 12 4l8 7.5", "M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"]),
  explore: () =>
    icon([
      "M4.5 4.5h6.5v6.5H4.5zM13 4.5h6.5v6.5H13zM4.5 13h6.5v6.5H4.5zM13 13h6.5v6.5H13",
    ]),
  inspect: () => icon(["M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z", "M16.5 16.5 21 21"]),
  saved: () =>
    icon([
      "M6 3.5h12a.5.5 0 0 1 .5.5v16.2a.5.5 0 0 1-.77.42L12 16.8l-5.73 3.82a.5.5 0 0 1-.77-.42V4a.5.5 0 0 1 .5-.5Z",
    ]),
};

// Shared between the desktop top nav below and the mobile tab bar — both
// list the same four destinations.
export const ITEMS = [
  { label: "Home", path: ROUTES.home, icon: ICONS.home },
  { label: "Explore", path: ROUTES.explore, icon: ICONS.explore },
  { label: "Inspect", path: ROUTES.identify, icon: ICONS.inspect },
  { label: "Saved", path: ROUTES.saved, icon: ICONS.saved },
];

// Mobile: a bottom tab strip (hidden from md up, where the desktop top nav
// below takes over). No border or divider between tabs — only the active
// tab's icon+label are colored to mark it, no background badge behind it.
// `fixed: false` lets identifyPage nest this inside its own fixed wrapper
// alongside its Continue action bar, instead of competing as a second
// independently-fixed bottom-0 element.
export function mobileTabBar(activePath, { fixed = true } = {}) {
  return el(
    "div",
    {
      class: `no-print md:hidden safe-bottom ${fixed ? "fixed bottom-0 left-0 right-0 z-20 " : ""}bg-[var(--surface)] border-t border-[var(--border)]`,
    },
    [
      el(
        "div",
        { class: "flex items-center gap-1 px-2 py-1.5", role: "tablist", "aria-label": "Primary" },
        ITEMS.map((item) => {
          const active = activePath === item.path;
          return el(
            "button",
            {
              type: "button",
              role: "tab",
              class: `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
              }`,
              onclick: () => router.navigate(item.path),
              "aria-selected": active ? "true" : "false",
            },
            [el("span", { class: "w-5 h-5", "aria-hidden": "true" }, [item.icon()]), el("span", {}, item.label)],
          );
        }),
      ),
    ],
  );
}

// Desktop: a proper top navigation bar — hidden below md, where mobile's
// bottom tab bar above takes over. Same devtools-style tab look: only the
// active tab gets a solid, fully rounded badge; inactive tabs are bare
// text/icon with no border or divider between them.
export function topNavigation(activePath) {
  return el(
    "nav",
    {
      class:
        "no-print hidden md:block md:sticky md:top-0 md:z-30 bg-[var(--surface-elevated)] border-b border-[var(--border)]",
      "aria-label": "Primary",
    },
    [
      el(
        "div",
        { class: "max-w-5xl mx-auto px-6 h-16 flex items-center justify-between" },
        [
          el(
            "button",
            {
              type: "button",
              class:
                "[font-family:var(--font-logo)] text-2xl font-bold text-[var(--accent)] tracking-tight",
              onclick: () => router.navigate(ROUTES.home),
            },
            "Inspectra",
          ),
          el(
            "div",
            { class: "flex items-center gap-1", role: "tablist", "aria-label": "Primary" },
            ITEMS.map((item) => {
              const active = activePath === item.path;
              return el(
                "button",
                {
                  type: "button",
                  role: "tab",
                  class: `flex items-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-medium transition-colors ${
                    active ? "bg-blue-50 text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                  }`,
                  onclick: () => router.navigate(item.path),
                  "aria-selected": active ? "true" : "false",
                },
                [
                  el("span", { class: "w-5 h-5", "aria-hidden": "true" }, [item.icon()]),
                  el("span", {}, item.label),
                ],
              );
            }),
          ),
        ],
      ),
    ],
  );
}
