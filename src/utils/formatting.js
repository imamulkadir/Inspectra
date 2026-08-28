export function formatStorage(gb) {
  if (gb == null) return "Not verified in the current dataset";
  return gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`;
}

export function formatDimensions(dimensionsMm) {
  if (!dimensionsMm) return "Not verified in the current dataset";
  const { height, width, depth } = dimensionsMm;
  if (height == null || width == null || depth == null) {
    return "Not verified in the current dataset";
  }
  return `${height} x ${width} x ${depth} mm`;
}

export function formatWeight(grams) {
  if (grams == null) return "Not verified in the current dataset";
  return `${grams} g`;
}

export function formatOrUnverified(value, formatter = (v) => String(v)) {
  if (value === null || value === undefined) {
    return "Not verified in the current dataset";
  }
  return formatter(value);
}

export function formatBoolean(value) {
  if (value === null || value === undefined) return "Unknown";
  return value ? "Yes" : "No";
}

export function titleCase(value) {
  return String(value ?? "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
