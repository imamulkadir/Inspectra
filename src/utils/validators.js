const A_NUMBER_PATTERN = /^A\d{4}$/;

// trim -> uppercase -> remove whitespace, per the dataset contract. Never
// rejects an unresolved-but-well-formed A-number as fake; that judgment
// belongs to the resolver, not the validator.
export function normalizeANumber(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function isValidANumberFormat(value) {
  return A_NUMBER_PATTERN.test(normalizeANumber(value));
}

export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
