import { el } from "../utils/dom.js";

// Large answer controls (section 24.7). Options come entirely from the
// resolved answer set — never hardcoded per rule.
export function answerControl({ answerSet, selection, onSelect, onValueChange, onUnableToVerify }) {
  if (answerSet?.options) {
    return el(
      "div",
      { class: "grid gap-2.5", role: "radiogroup" },
      answerSet.options.map((option) =>
        el(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": selection?.optionId === option.id ? "true" : "false",
            class: `tap-target text-left rounded-2xl border px-4 py-3.5 font-medium transition-colors ${
              selection?.optionId === option.id
                ? "border-[var(--accent)] bg-blue-50 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface-elevated)]"
            }`,
            onclick: () => onSelect(option.id),
          },
          option.label,
        ),
      ),
    );
  }

  const isNumber = answerSet?.inputType === "number";

  return el("div", { class: "space-y-3" }, [
    el("input", {
      type: isNumber ? "number" : "text",
      inputmode: isNumber ? "decimal" : undefined,
      value: selection?.value ?? "",
      class: "tap-target w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-base",
      placeholder: isNumber ? "Enter a value" : "Enter an observation",
      oninput: (event) => onValueChange(event.target.value),
      disabled: selection?.unableToVerify === true,
    }),
    el(
      "label",
      { class: "flex items-center gap-2 text-sm text-[var(--text-secondary)]" },
      [
        el("input", {
          type: "checkbox",
          checked: selection?.unableToVerify === true,
          onchange: (event) => onUnableToVerify(event.target.checked),
        }),
        "Unable to verify",
      ],
    ),
  ]);
}
