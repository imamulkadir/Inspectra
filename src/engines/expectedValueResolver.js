import { getByPath } from "../utils/objectPath.js";
import { COMPARISON_OUTCOME } from "../core/constants.js";

// Resolves rule.expected (present on 21/343 rules) against the current
// inspection context. Shapes observed in the dataset: {deviceField},
// {variantField}, {dataset, lookup}, {officialUnlockedLabel}, {resolver}.
export function resolveExpectedValue(expected, context) {
  if (!expected) return { resolved: false, value: undefined };

  if (expected.deviceField) {
    const value = getByPath(context.device, expected.deviceField);
    return { resolved: value !== undefined, value };
  }

  if (expected.variantField) {
    const value = getByPath(context.variant, expected.variantField);
    return { resolved: value !== undefined, value };
  }

  if (expected.resolver) {
    const [root, ...rest] = expected.resolver.split(".");
    const source = root === "device" ? context.device : root === "variant" ? context.variant : null;
    const value = getByPath(source, rest.join("."));
    return { resolved: value !== undefined, value };
  }

  if (expected.dataset === "regional-variants" && expected.lookup) {
    const value = getByPath(context.variant, expected.lookup);
    return { resolved: value !== undefined, value };
  }

  if (expected.officialUnlockedLabel) {
    return { resolved: true, value: expected.officialUnlockedLabel };
  }

  return { resolved: false, value: undefined };
}

// Never uses loose substring matching that could create a false MATCH
// (section 15.1). Free-text is compared with a normalized exact match only.
export function compareValues(observed, expectedResolution) {
  if (!expectedResolution.resolved) return COMPARISON_OUTCOME.UNRESOLVED;
  if (observed === undefined || observed === null || observed === "") {
    return COMPARISON_OUTCOME.NOT_COMPARABLE;
  }

  const expectedValue = expectedResolution.value;
  if (expectedValue === undefined || expectedValue === null) {
    return COMPARISON_OUTCOME.NOT_COMPARABLE;
  }

  if (Array.isArray(expectedValue)) {
    const normalizedObserved = normalize(observed);
    return expectedValue.some((item) => normalize(item) === normalizedObserved)
      ? COMPARISON_OUTCOME.MATCH
      : COMPARISON_OUTCOME.MISMATCH;
  }

  return normalize(observed) === normalize(expectedValue)
    ? COMPARISON_OUTCOME.MATCH
    : COMPARISON_OUTCOME.MISMATCH;
}

function normalize(value) {
  if (typeof value === "string") return value.trim().toLowerCase();
  return value;
}
