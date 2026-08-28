import { DATA_ROOT } from "./paths.js";
import { DatasetError } from "../core/errorBoundary.js";

const cache = new Map();

async function loadJson(relativePath) {
  const url = `${DATA_ROOT}${relativePath}`;

  if (cache.has(url)) return cache.get(url);

  const pending = fetch(url, {
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) {
      throw new DatasetError(
        `Unable to load ${relativePath} (${response.status} ${response.statusText})`,
        { filePath: relativePath, status: response.status },
      );
    }
    try {
      return await response.json();
    } catch (error) {
      throw new DatasetError(`Invalid JSON in ${relativePath}: ${error.message}`, {
        filePath: relativePath,
      });
    }
  });

  cache.set(url, pending);

  try {
    return await pending;
  } catch (error) {
    cache.delete(url);
    throw error;
  }
}

export const loadManifest = () => loadJson("manifest.json");
export const loadValidationReport = () => loadJson("validation/validation-report.json");
export const loadDataQuality = () => loadJson("validation/data-quality.json");
export const loadLocalization = () => loadJson("localization/en.json");
export const loadDeviceIndex = () => loadJson("devices/device-index.json");

export async function loadModelBrowserData() {
  const [manifest, index, catalog, finishes, sources] = await Promise.all([
    loadJson("manifest.json"),
    loadJson("devices/device-index.json"),
    loadJson("devices/device-catalog.json"),
    loadJson("finishes/finish-catalog.json"),
    loadJson("sources/sources.json"),
  ]);

  return {
    manifest,
    deviceIndex: index.devices ?? [],
    devices: catalog.devices ?? [],
    finishes: finishes.finishes ?? [],
    sources: sources.sources ?? [],
  };
}

export async function loadIdentificationData() {
  const [devices, finishes, variants, capabilities, capabilityDefs, releases, compatibility] =
    await Promise.all([
      loadJson("devices/device-catalog.json"),
      loadJson("finishes/finish-catalog.json"),
      loadJson("variants/regional-variants.json"),
      loadJson("capabilities/model-capabilities.json"),
      loadJson("capabilities/capability-definitions.json"),
      loadJson("ios/releases.json"),
      loadJson("ios/model-compatibility.json"),
    ]);

  return {
    devices: devices.devices ?? [],
    finishes: finishes.finishes ?? [],
    variants: variants.variants ?? [],
    modelCapabilities: capabilities.models ?? [],
    capabilityDefinitions: capabilityDefs.capabilities ?? [],
    releases,
    compatibility,
  };
}

export async function loadInspectionData() {
  const [
    manifest,
    devices,
    variants,
    capabilities,
    categories,
    answers,
    rules,
    followUps,
    navigation,
    partsHistory,
    diagnostics,
    scoringPolicy,
    riskPolicy,
    coveragePolicy,
    reportLanguage,
    disclaimers,
    sources,
    serviceProgramsFile,
  ] = await Promise.all([
    loadJson("manifest.json"),
    loadJson("devices/device-catalog.json"),
    loadJson("variants/regional-variants.json"),
    loadJson("capabilities/model-capabilities.json"),
    loadJson("inspections/categories.json"),
    loadJson("inspections/answer-options.json"),
    loadJson("inspections/rules.json"),
    loadJson("inspections/follow-up-rules.json"),
    loadJson("navigation/settings-paths.json"),
    loadJson("inspections/parts-service-history.json"),
    loadJson("inspections/browser-diagnostics.json"),
    loadJson("policy/scoring-policy.json"),
    loadJson("policy/risk-policy.json"),
    loadJson("policy/coverage-confidence-policy.json"),
    loadJson("policy/report-language.json"),
    loadJson("legal/disclaimers.json"),
    loadJson("sources/sources.json"),
    loadJson("service-programs/service-programs.json"),
  ]);

  return {
    manifest,
    devices: devices.devices ?? [],
    variants: variants.variants ?? [],
    modelCapabilities: capabilities.models ?? [],
    categories: categories.categories ?? [],
    answerSets: answers.answerSets ?? [],
    statuses: answers.statuses ?? [],
    rules: rules.rules ?? [],
    followUps: followUps.followUps ?? [],
    settingsPaths: navigation.paths ?? [],
    partsHistory,
    diagnostics: diagnostics.diagnostics ?? [],
    diagnosticRuntimePolicy: diagnostics.runtimePolicy ?? null,
    scoringPolicy,
    riskPolicy,
    coveragePolicy,
    reportLanguage,
    disclaimers,
    sources: sources.sources ?? [],
    servicePrograms: serviceProgramsFile,
  };
}

export function invalidate(relativePath) {
  cache.delete(`${DATA_ROOT}${relativePath}`);
}

export function clearCache() {
  cache.clear();
}
