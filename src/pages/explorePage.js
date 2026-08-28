import { el, mount, clear } from "../utils/dom.js";
import { mobileBrandBar } from "../components/appHeader.js";
import { topNavigation, mobileTabBar } from "../components/bottomNavigation.js";
import { deviceCard } from "../components/deviceCard.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { emptyState } from "../components/emptyState.js";
import { siteFooter } from "../components/footer.js";
import { ROUTES } from "../config/routes.js";
import { getModelBrowserCatalog } from "../data/catalog.js";

const SEARCH_DEBOUNCE_MS = 250;

export async function mountPage(root) {
  const state = { search: "", family: "all", segment: "all" };
  let searchDebounce = null;
  const customSelects = [];
  const dropdownGroup = createDropdownGroup();

  const page = el("div", { id: "main", class: "pb-20" }, [
    topNavigation(ROUTES.explore),
    mobileBrandBar({
      pageTitle: "Explore models",
      pageDescription: "Browse specs and generations across every supported iPhone.",
    }),
    el("div", { id: "explore-body" }, [el("div", { class: "px-4 py-6 max-w-5xl mx-auto" }, [skeleton({ lines: 6 })])]),
    el("div", { class: "max-w-5xl mx-auto" }, [siteFooter()]),
    mobileTabBar(ROUTES.explore),
  ]);
  mount(root, page);

  let catalog;
  try {
    catalog = await getModelBrowserCatalog();
  } catch (error) {
    mount(root.querySelector("#explore-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  const families = [...new Set(catalog.devices.map((d) => d.family))];

  function segmentsForFamily(family) {
    return [
      ...new Set(
        catalog.devices
          .filter((d) => family === "all" || d.family === family)
          .map((d) => d.segment),
      ),
    ];
  }

  function renderResults() {
    const results = root.querySelector("#explore-results");
    if (!results) return;

    const filtered = catalog.devices
      .filter((d) => state.family === "all" || d.family === state.family)
      .filter((d) => state.segment === "all" || d.segment === state.segment)
      .filter((d) => d.marketingName.toLowerCase().includes(state.search.toLowerCase()))
      .sort((a, b) => b.introducedYear - a.introducedYear || a.marketingName.localeCompare(b.marketingName));

    clear(results);

    if (filtered.length === 0) {
      results.appendChild(emptyState({ title: "No models match", message: "Try clearing filters or search." }));
      return;
    }

    results.appendChild(
      el(
        "div",
        { class: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" },
        filtered.map((device) => deviceCard(device)),
      ),
    );
  }

  function buildShell() {
    const body = root.querySelector("#explore-body");
    if (!body) return;
    clear(body);

    // Forward-declared so familySelect's onChange (only invoked later, on a
    // user click, by which point this is assigned) can push a narrowed
    // segment list into the already-built segmentSelect.
    let segmentSelect;

    const familySelect = customSelect({
      label: "Family",
      allLabel: "All families",
      value: state.family,
      options: ["all", ...families],
      group: dropdownGroup,
      onChange: (v) => {
        state.family = v;
        const availableSegments = segmentsForFamily(v);
        if (state.segment !== "all" && !availableSegments.includes(state.segment)) {
          state.segment = "all";
        }
        segmentSelect.setOptions(["all", ...availableSegments], state.segment);
        renderResults();
      },
    });
    segmentSelect = customSelect({
      label: "Segment",
      allLabel: "All segments",
      value: state.segment,
      options: ["all", ...segmentsForFamily(state.family)],
      formatOption: humanizeSegment,
      group: dropdownGroup,
      onChange: (v) => { state.segment = v; renderResults(); },
    });
    customSelects.push(familySelect, segmentSelect);

    body.appendChild(
      el("div", { class: "px-4 py-4 space-y-4 max-w-5xl mx-auto" }, [
        el("input", {
          type: "search",
          placeholder: "Search by model name",
          class: "tap-target w-full rounded-2xl border border-[var(--border)] px-4 py-3",
          value: state.search,
          oninput: (e) => {
            state.search = e.target.value;
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(renderResults, SEARCH_DEBOUNCE_MS);
          },
        }),
        el("div", { class: "flex flex-wrap gap-2" }, [familySelect, segmentSelect]),
        el("div", { id: "explore-results", class: "pt-1" }),
      ]),
    );

    renderResults();
  }

  buildShell();

  return () => {
    customSelects.forEach((s) => s.destroy());
  };
}

// device.segment values are raw dataset slugs ("pro_max", "e", "se") meant
// for filtering, not display — this only affects the dropdown's own label
// text, never the underlying value used to filter devices.
function humanizeSegment(segment) {
  if (segment === "se") return "SE";
  return segment
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Coordinates multiple customSelect popovers on one page so opening one
// closes any other that's already open — without this, two dropdowns could
// be visibly open at the same time, overlapping each other.
function createDropdownGroup() {
  const closers = new Set();
  return {
    register(close) { closers.add(close); },
    unregister(close) { closers.delete(close); },
    closeOthers(except) {
      closers.forEach((close) => { if (close !== except) close(); });
    },
  };
}

// A custom popover instead of a native <select>: native dropdown menus are
// rendered by the OS/browser and can't be restyled to match the app's
// rounded, soft-shadow visual language (section 25.5) — they show up sharp
// and jarring against everything else on the page.
function customSelect({ label, allLabel, value, options: initialOptions, onChange, formatOption = (opt) => opt, group }) {
  let open = false;
  let current = value;
  let options = initialOptions;

  const optionLabel = (opt) => (opt === "all" ? allLabel : formatOption(opt));

  const labelSpan = el("span", {}, optionLabel(current));
  const trigger = el(
    "button",
    {
      type: "button",
      class:
        "tap-target inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-4 pr-3.5 py-2 text-sm font-medium text-[var(--text-primary)]",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      onclick: (e) => { e.stopPropagation(); setOpen(!open); },
    },
    [labelSpan, el("span", { "aria-hidden": "true", class: "text-[var(--text-secondary)] text-[10px]" }, "▾")],
  );

  const panel = el("div", {
    // overflow-hidden clips each option button's own background/hover
    // highlight to the panel's rounded corners — without it, a highlighted
    // top/bottom option's square corners visibly poke out past the
    // rounded-2xl border.
    class: "hidden absolute left-0 top-full mt-2 min-w-[11rem] rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-lg py-1.5 z-30 overflow-hidden",
    role: "listbox",
    "aria-label": label,
  });

  function renderOptions() {
    clear(panel);
    options.forEach((opt) => {
      const selected = opt === current;
      panel.appendChild(
        el(
          "button",
          {
            type: "button",
            role: "option",
            "aria-selected": String(selected),
            class: `tap-target w-full text-left px-4 py-2.5 text-sm ${selected ? "font-semibold text-[var(--accent)] bg-blue-50" : "text-[var(--text-primary)] hover:bg-[var(--surface)]"}`,
            onclick: (e) => {
              e.stopPropagation();
              current = opt;
              labelSpan.textContent = optionLabel(opt);
              renderOptions();
              setOpen(false);
              onChange(opt);
            },
          },
          optionLabel(opt),
        ),
      );
    });
  }

  function close() { setOpen(false); }

  function setOpen(next) {
    if (next) group?.closeOthers(close);
    open = next;
    panel.classList.toggle("hidden", !open);
    trigger.setAttribute("aria-expanded", String(open));
  }

  function handleDocClick(e) {
    if (open && !wrapper.contains(e.target)) setOpen(false);
  }

  function handleKeydown(e) {
    if (open && e.key === "Escape") {
      setOpen(false);
      trigger.focus();
    }
  }

  document.addEventListener("click", handleDocClick);
  document.addEventListener("keydown", handleKeydown);
  group?.register(close);

  renderOptions();
  const wrapper = el("div", { class: "relative inline-block" }, [trigger, panel]);

  // Lets a caller (e.g. the family dropdown) narrow another dropdown's
  // (segment's) option list in place, without tearing down and rebuilding
  // its DOM node or re-registering its event listeners.
  wrapper.setOptions = (newOptions, newValue) => {
    options = newOptions;
    current = newValue;
    labelSpan.textContent = optionLabel(current);
    renderOptions();
  };

  wrapper.destroy = () => {
    document.removeEventListener("click", handleDocClick);
    document.removeEventListener("keydown", handleKeydown);
    group?.unregister(close);
  };

  return wrapper;
}
