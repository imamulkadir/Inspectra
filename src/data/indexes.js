import { normalizeANumber } from "../utils/validators.js";

function toMap(items, keySelector) {
  const map = new Map();
  for (const item of items ?? []) {
    const key = keySelector(item);
    if (key != null) map.set(key, item);
  }
  return map;
}

function toGroupedMap(items, keySelector) {
  const map = new Map();
  for (const item of items ?? []) {
    const key = keySelector(item);
    if (key == null) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function buildDeviceIndexes({ devices = [], deviceIndex = [] } = {}) {
  return {
    deviceById: toMap(devices.length ? devices : deviceIndex, (d) => d.id),
    deviceIndexById: toMap(deviceIndex, (d) => d.id),
  };
}

export function buildFinishIndexes({ finishes = [] } = {}) {
  return { finishById: toMap(finishes, (f) => f.id) };
}

export function buildVariantIndexes({ variants = [] } = {}) {
  return {
    variantById: toMap(variants, (v) => v.id),
    variantByANumber: toMap(variants, (v) => normalizeANumber(v.aNumber)),
    variantsByDeviceId: toGroupedMap(variants, (v) => v.deviceId),
  };
}

export function buildCapabilityIndexes({ modelCapabilities = [] } = {}) {
  return {
    capabilitiesByDeviceId: toMap(modelCapabilities, (c) => c.deviceId),
  };
}

export function buildInspectionIndexes({
  categories = [],
  answerSets = [],
  rules = [],
  settingsPaths = [],
} = {}) {
  return {
    categoryById: toMap(categories, (c) => c.id),
    answerSetById: toMap(answerSets, (a) => a.id),
    ruleById: toMap(rules, (r) => r.id),
    rulesByCategoryId: toGroupedMap(rules, (r) => r.categoryId),
    navigationById: toMap(settingsPaths, (n) => n.id),
  };
}

export function buildSourceIndexes({ sources = [] } = {}) {
  return { sourceById: toMap(sources, (s) => s.id) };
}

export function buildDiagnosticIndexes({ diagnostics = [] } = {}) {
  return { diagnosticById: toMap(diagnostics, (d) => d.id) };
}
