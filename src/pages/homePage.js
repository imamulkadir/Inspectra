import { el, mount, svgEl } from "../utils/dom.js";
import { button } from "../components/button.js";
import { topNavigation, mobileTabBar } from "../components/bottomNavigation.js";
import { mobileBrandBar } from "../components/appHeader.js";
import { siteFooter } from "../components/footer.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { store } from "../core/state.js";
import { ANALYTICAL_QUALIFIER } from "../core/constants.js";
import { formatDate } from "../utils/dates.js";
import { INSPECTION_PROFILES, ruleIncludedInProfile } from "../config/inspectionProfiles.js";
import { getInspectionCatalog } from "../data/catalog.js";
import { openModal } from "../components/dialog.js";

export async function mountPage(root) {
  const manifest = store.getState().dataset.manifest;

  // Fired now (not awaited) so it's likely already resolved by the time the
  // user taps a depth card below — getInspectionCatalog() is memoized, so
  // this is the same cached fetch inspectionSetupPage would otherwise make.
  getInspectionCatalog().catch(() => {});

  const page = el("div", { id: "main", class: "pb-20" }, [
    topNavigation(ROUTES.home),
    mobileBrandBar(),
    el("div", { class: "md:max-w-2xl md:mx-auto" }, [
      el("div", { class: "px-5 pt-10 pb-8" }, [
        el(
          "h1",
          { class: "text-4xl font-bold leading-tight mb-3" },
          "Know exactly what you're buying, before you buy it.",
        ),
        el(
          "p",
          { class: "text-lg text-[var(--text-secondary)] mb-8" },
          "A guided, model-specific inspection for used iPhones, built on an official Apple specification dataset instead of guesswork.",
        ),
        el("div", { class: "space-y-3 md:max-w-xs md:mx-auto" }, [
          button({
            label: "Inspect a used iPhone",
            onClick: () => router.navigate(ROUTES.identify),
          }),
          button({
            label: "Explore iPhone models",
            variant: "secondary",
            onClick: () => router.navigate(ROUTES.explore),
          }),
        ]),
      ]),

      section("Why a used iPhone needs more than a glance", [
        "A used iPhone can look perfect and still hide a mismatched storage claim, a swapped part, an unresolved Activation Lock, or water-exposure indicators the seller never mentioned.",
        "Inspectra walks through the identification and inspection steps a careful buyer would want to run, in order, without needing prior technical knowledge.",
      ]),

      section("How it works", [
        "Identify the exact model first, by A-number lookup or manual selection, then confirm storage, finish, and installed iOS version against the official specification for that model.",
        "Answer a guided inspection built specifically for that model and depth — pick one below.",
        "Get a report that separates confirmed facts, your own observations, and flagged inconsistencies, so it's clear what was actually checked and what still depends on trusting the seller.",
      ]),

      inspectionDepthSection(),

      section("What Inspectra can and cannot verify", [
        "It can compare what you observe against official dataset facts for that exact model, and guide a structured, repeatable inspection so nothing gets skipped.",
        "It cannot check an IMEI blacklist, confirm legal ownership or outstanding finance, or guarantee authenticity, undisclosed repair history, or how the phone will perform after the sale. Treat the report as a structured second opinion, not a verdict.",
      ]),

      section("Private and local-first", [
        "Every inspection is saved only on this device, in the browser's own storage. Nothing is uploaded to a server, and no account is required.",
      ]),

      el("div", { class: "px-5 py-4" }, [
        el(
          "p",
          { class: "text-xs italic text-[var(--text-secondary)]" },
          ANALYTICAL_QUALIFIER,
        ),
        manifest
          ? el(
              "p",
              { class: "text-xs text-[var(--text-secondary)] mt-1" },
              `Dataset ${manifest.version} · verified ${formatDate(manifest.verifiedAt)}`,
            )
          : null,
      ]),
    ]),

    el("div", { class: "md:max-w-2xl md:mx-auto" }, [siteFooter()]),
    mobileTabBar(ROUTES.home),
  ]);

  mount(root, page);
  return () => {};
}

function section(title, paragraphs) {
  return el("div", { class: "px-5 py-6 border-t border-[var(--border)]" }, [
    el("h2", { class: "text-lg font-semibold mb-3" }, title),
    el(
      "div",
      { class: "space-y-2" },
      paragraphs.map((text) =>
        el("p", { class: "text-sm text-[var(--text-secondary)]" }, text),
      ),
    ),
  ]);
}

const PROFILE_ORDER = ["quick", "standard", "deep"];

// A single colored star per tier instead of a "1/2/3 dots filled" progress
// indicator — that read as a rating (Quick "worse" than Deep) rather than
// three different, equally valid choices for different situations.
const DEPTH_STAR_COLOR = {
  quick: "#f5b400",
  standard: "#16a34a",
  deep: "#ea580c",
};

function starIcon(color) {
  return svgEl(
    "svg",
    { viewBox: "0 0 24 24", fill: color, class: "w-5 h-5", "aria-hidden": "true" },
    [svgEl("path", { d: "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" })],
  );
}

// Standard is a curated allowlist (see inspectionProfiles.js), not a
// priority/category filter like quick/deep, so it has no includedPriorities/
// includedCategories to describe — just its own fixed check count instead.
function depthCardMeta(profile) {
  if (profile.explicitRuleIds) return `${profile.explicitRuleIds.length} curated checks`;
  const categoryCount = profile.includedCategories ? `${profile.includedCategories.length} categories` : "Every category";
  const priorityLabel = profile.includedPriorities.length > 1 ? "Every priority level" : "Critical checks only";
  return `${categoryCount} · ${priorityLabel}`;
}

function depthCard(profile) {
  return el("div", { class: "rounded-2xl border border-[var(--border)] p-4" }, [
    el("div", { class: "flex items-center justify-between mb-1" }, [
      el("h3", { class: "font-semibold" }, profile.label),
      starIcon(DEPTH_STAR_COLOR[profile.id]),
    ]),
    el("p", { class: "text-sm text-[var(--text-secondary)] mb-2" }, profile.description),
    el("div", { class: "flex items-center justify-between gap-3" }, [
      el("p", { class: "text-xs font-medium text-[var(--text-secondary)]" }, depthCardMeta(profile)),
      el(
        "button",
        {
          type: "button",
          class: "tap-target shrink-0 text-xs font-semibold text-[var(--accent)]",
          onclick: () => openDepthModal(profile),
        },
        "Details",
      ),
    ]),
  ]);
}

// Grouped straight from the dataset's rules, filtered the same way
// ruleResolver.buildRuleQueue() filters the main queue for a profile — but
// without a device's applicability, so this is every check the profile
// *could* include, not what a specific model will actually be asked.
function buildDepthGroups(catalog, profileId) {
  const byCategory = new Map();
  for (const rule of catalog.rules) {
    if (!ruleIncludedInProfile(rule, profileId)) continue;
    if (!byCategory.has(rule.categoryId)) {
      byCategory.set(rule.categoryId, { category: catalog.categoryById.get(rule.categoryId), rules: [] });
    }
    byCategory.get(rule.categoryId).rules.push(rule);
  }
  return [...byCategory.values()].sort((a, b) => (a.category?.order ?? 0) - (b.category?.order ?? 0));
}

function renderDepthModalBody(profile, groups) {
  const totalChecks = groups.reduce((sum, g) => sum + g.rules.length, 0);
  return [
    el("p", { class: "text-sm text-[var(--text-secondary)] mb-1" }, profile.description),
    el(
      "p",
      { class: "text-xs italic text-[var(--text-secondary)] mb-4" },
      `${totalChecks} checks across ${groups.length} categories, defined for every supported model. The checks that actually apply depend on the exact iPhone you select.`,
    ),
    el(
      "div",
      { class: "space-y-4" },
      groups.map(({ category, rules }) =>
        el("div", {}, [
          el("h3", { class: "text-sm font-semibold mb-1.5" }, `${category?.name ?? "Uncategorized"} (${rules.length})`),
          el(
            "ul",
            { class: "space-y-1 list-disc list-inside" },
            rules.map((rule) => el("li", { class: "text-sm text-[var(--text-secondary)]" }, rule.title)),
          ),
        ]),
      ),
    ),
  ];
}

async function openDepthModal(profile) {
  const closeLoading = openModal({ title: profile.label, body: el("p", { class: "text-sm text-[var(--text-secondary)]" }, "Loading checks…") });

  let catalog;
  try {
    catalog = await getInspectionCatalog();
  } catch (error) {
    closeLoading();
    openModal({ title: profile.label, body: el("p", { class: "text-sm text-[var(--danger)]" }, `Couldn't load the checklist: ${error.message}`) });
    return;
  }

  const groups = buildDepthGroups(catalog, profile.id);
  closeLoading();
  openModal({ title: profile.label, body: renderDepthModalBody(profile, groups) });
}

function inspectionDepthSection() {
  return el("div", { class: "px-5 py-6 border-t border-[var(--border)]" }, [
    el("h2", { class: "text-lg font-semibold mb-1" }, "Three depths, same standard"),
    el(
      "p",
      { class: "text-sm text-[var(--text-secondary)] mb-3" },
      "Each step adds more categories and priority levels than the last — pick the one that matches how much time you have.",
    ),
    el(
      "div",
      { class: "space-y-2.5" },
      PROFILE_ORDER.map((id) => depthCard(INSPECTION_PROFILES[id])),
    ),
  ]);
}
