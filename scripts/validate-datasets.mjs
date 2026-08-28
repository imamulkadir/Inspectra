// Read-only structural validator for the supplied data/iphone/ dataset.
// Never writes to data/iphone/. Fails the production build on structural or
// referential errors; the dataset's own validation-report.json remains the
// authoritative content-quality source — this is an additional deployment
// guard against a corrupted or incomplete copy of the folder.
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { DATASET_VERSION_DIR } from "../src/generated/datasetPath.js";

const root = path.resolve("data/iphone", DATASET_VERSION_DIR);

const REQUIRED_FILES = [
  "manifest.json",
  "validation/validation-report.json",
  "validation/data-quality.json",
  "localization/en.json",
  "devices/device-index.json",
  "devices/device-catalog.json",
  "devices/specification-field-catalog.json",
  "finishes/finish-catalog.json",
  "sources/sources.json",
  "variants/regional-variants.json",
  "capabilities/capability-definitions.json",
  "capabilities/model-capabilities.json",
  "ios/releases.json",
  "ios/model-compatibility.json",
  "navigation/settings-paths.json",
  "inspections/categories.json",
  "inspections/answer-options.json",
  "inspections/rules.json",
  "inspections/follow-up-rules.json",
  "inspections/parts-service-history.json",
  "inspections/browser-diagnostics.json",
  "policy/scoring-policy.json",
  "policy/risk-policy.json",
  "policy/coverage-confidence-policy.json",
  "policy/report-language.json",
  "legal/disclaimers.json",
  "service-programs/service-programs.json",
];

function safePath(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  const relative = path.relative(root, absolutePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe dataset path: ${relativePath}`);
  }

  return absolutePath;
}

async function parseJson(relativePath) {
  const raw = await readFile(safePath(relativePath), "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`, { cause: error });
  }
}

async function sha256(relativePath) {
  const buffer = await readFile(safePath(relativePath));
  return createHash("sha256").update(buffer).digest("hex");
}

async function validateChecksums() {
  let checksumFile;
  try {
    checksumFile = await readFile(safePath("checksums.sha256"), "utf8");
  } catch {
    console.warn("No checksums.sha256 found; skipping integrity check.");
    return;
  }

  const lines = checksumFile
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (!match) throw new Error(`Invalid checksum line: ${line}`);

    const expected = match[1].toLowerCase();
    const relativePath = match[2].replace(/^\.\//, "");

    let actual;
    try {
      actual = await sha256(relativePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        // Known supplied-dataset gap: checksums.sha256/manifest.json can name
        // a file (e.g. README.md) that ships under a different filename
        // (README_dataset.md). Never edit the dataset to reconcile this —
        // warn and continue rather than blocking the build.
        console.warn(`Checksum entry has no matching file on disk: ${relativePath} (skipped)`);
        continue;
      }
      throw error;
    }

    if (actual !== expected) {
      throw new Error(
        `Checksum mismatch: ${relativePath} — the supplied dataset copy may be corrupted or was edited.`,
      );
    }
  }
}

function assertUnique(items, selector, label) {
  const seen = new Set();
  for (const item of items) {
    const value = selector(item);
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

async function main() {
  for (const relativePath of REQUIRED_FILES) {
    await access(safePath(relativePath)).catch(() => {
      throw new Error(`Missing required dataset file: ${relativePath}`);
    });
    await parseJson(relativePath);
  }

  const manifest = await parseJson("manifest.json");
  if (!manifest.version) throw new Error("Dataset manifest version is missing.");
  if (manifest.validationStatus !== "PASS") {
    throw new Error(
      `Dataset manifest validation status is ${manifest.validationStatus ?? "missing"}.`,
    );
  }

  const validationReport = await parseJson("validation/validation-report.json");
  if (validationReport.status !== "PASS") {
    throw new Error(
      `Dataset validation report status is ${validationReport.status ?? "missing"}.`,
    );
  }

  const [
    deviceIndexFile,
    devicesFile,
    finishesFile,
    variantsFile,
    capabilityDefsFile,
    capabilitiesFile,
    categoriesFile,
    answersFile,
    rulesFile,
    navigationFile,
    followUpsFile,
    sourcesFile,
    partsHistory,
    scoringPolicy,
    riskPolicy,
    coveragePolicy,
    disclaimers,
  ] = await Promise.all([
    parseJson("devices/device-index.json"),
    parseJson("devices/device-catalog.json"),
    parseJson("finishes/finish-catalog.json"),
    parseJson("variants/regional-variants.json"),
    parseJson("capabilities/capability-definitions.json"),
    parseJson("capabilities/model-capabilities.json"),
    parseJson("inspections/categories.json"),
    parseJson("inspections/answer-options.json"),
    parseJson("inspections/rules.json"),
    parseJson("navigation/settings-paths.json"),
    parseJson("inspections/follow-up-rules.json"),
    parseJson("sources/sources.json"),
    parseJson("inspections/parts-service-history.json"),
    parseJson("policy/scoring-policy.json"),
    parseJson("policy/risk-policy.json"),
    parseJson("policy/coverage-confidence-policy.json"),
    parseJson("legal/disclaimers.json"),
  ]);

  const deviceIndex = deviceIndexFile.devices ?? [];
  const devices = devicesFile.devices ?? [];
  const finishes = finishesFile.finishes ?? [];
  const variants = variantsFile.variants ?? [];
  const capabilityDefs = capabilityDefsFile.capabilities ?? [];
  const modelCapabilities = capabilitiesFile.models ?? [];
  const categories = categoriesFile.categories ?? [];
  const answerSets = answersFile.answerSets ?? [];
  const rules = rulesFile.rules ?? [];
  const navigationPaths = navigationFile.paths ?? [];
  const followUps = followUpsFile.followUps ?? [];
  const sources = sourcesFile.sources ?? [];

  assertUnique(deviceIndex, (item) => item.id, "device-index ID");
  assertUnique(devices, (item) => item.id, "device ID");
  assertUnique(finishes, (item) => item.id, "finish ID");
  assertUnique(variants, (item) => item.id, "variant ID");
  assertUnique(categories, (item) => item.id, "category ID");
  assertUnique(answerSets, (item) => item.id, "answer-set ID");
  assertUnique(rules, (item) => item.id, "rule ID");
  assertUnique(navigationPaths, (item) => item.id, "navigation ID");
  assertUnique(sources, (item) => item.id, "source ID");

  const deviceIds = new Set(devices.map((item) => item.id));
  const finishIds = new Set(finishes.map((item) => item.id));
  const capabilityIds = new Set(capabilityDefs.map((item) => item.id));
  const categoryIds = new Set(categories.map((item) => item.id));
  const answerSetIds = new Set(answerSets.map((item) => item.id));
  const ruleIds = new Set(rules.map((item) => item.id));
  const navigationIds = new Set(navigationPaths.map((item) => item.id));
  const sourceIds = new Set(sources.map((item) => item.id));

  for (const variant of variants) {
    if (!deviceIds.has(variant.deviceId)) {
      throw new Error(`${variant.id} references missing device ${variant.deviceId}.`);
    }
    if (!/^A\d{4}$/.test(variant.aNumber)) {
      throw new Error(`${variant.id} has non-normalized A-number ${variant.aNumber}.`);
    }
    for (const sid of variant.sourceIds ?? []) {
      if (!sourceIds.has(sid)) {
        throw new Error(`${variant.id} references missing source ${sid}.`);
      }
    }
  }

  for (const device of devices) {
    for (const finishId of device.finishIds ?? []) {
      if (!finishIds.has(finishId)) {
        throw new Error(`${device.id} references missing finish ${finishId}.`);
      }
    }
    for (const sid of device.sourceIds ?? []) {
      if (!sourceIds.has(sid)) {
        throw new Error(`${device.id} references missing source ${sid}.`);
      }
    }
  }

  for (const entry of modelCapabilities) {
    if (!deviceIds.has(entry.deviceId)) {
      throw new Error(`Capability record references missing device ${entry.deviceId}.`);
    }
  }

  for (const rule of rules) {
    if (!categoryIds.has(rule.categoryId)) {
      throw new Error(`${rule.id} references missing category ${rule.categoryId}.`);
    }
    if (!answerSetIds.has(rule.answerSetId)) {
      throw new Error(`${rule.id} references missing answer set ${rule.answerSetId}.`);
    }
    if (rule.navigationId && !navigationIds.has(rule.navigationId)) {
      throw new Error(`${rule.id} references missing navigation path ${rule.navigationId}.`);
    }
    for (const capId of [
      ...(rule.applicability?.capabilityAll ?? []),
      ...(rule.applicability?.capabilityAny ?? []),
      ...(rule.applicability?.capabilityNone ?? []),
    ]) {
      if (!capabilityIds.has(capId)) {
        throw new Error(`${rule.id} references unknown capability ${capId}.`);
      }
    }
    for (const modelId of rule.applicability?.modelIds ?? []) {
      if (!deviceIds.has(modelId)) {
        throw new Error(`${rule.id} references missing device ${modelId}.`);
      }
    }
    for (const sourceId of rule.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`${rule.id} references missing source ${sourceId}.`);
      }
    }
    if (rule.scoring?.requiresCalibration !== true) {
      console.warn(
        `${rule.id}: scoring.requiresCalibration is not explicitly true; verify calibration policy has not silently changed.`,
      );
    }
  }

  for (const followUp of followUps) {
    for (const ruleId of followUp.addRuleIds ?? []) {
      if (!ruleIds.has(ruleId)) {
        throw new Error(`${followUp.id} references missing follow-up rule ${ruleId}.`);
      }
    }
    if (followUp.trigger?.ruleId && !ruleIds.has(followUp.trigger.ruleId)) {
      throw new Error(`${followUp.id} trigger references missing rule ${followUp.trigger.ruleId}.`);
    }
  }

  for (const entry of partsHistory.modelCoverage ?? []) {
    for (const deviceId of entry.deviceIds ?? []) {
      if (!deviceIds.has(deviceId)) {
        throw new Error(`parts-service-history.json references missing device ${deviceId}.`);
      }
    }
  }

  // Uncalibrated policy values must remain null, never silently replaced with guesses.
  const scoringWeights = Object.values(scoringPolicy.categoryWeights ?? {});
  if (
    scoringPolicy.requiresCalibration === true &&
    scoringWeights.some((weight) => weight !== null)
  ) {
    throw new Error(
      "scoring-policy.json marks requiresCalibration true but categoryWeights contains a non-null value.",
    );
  }
  if (
    coveragePolicy.requiresCalibration === true &&
    coveragePolicy.confidenceThresholds !== null
  ) {
    throw new Error(
      "coverage-confidence-policy.json marks requiresCalibration true but confidenceThresholds is non-null.",
    );
  }
  if (!disclaimers.preInspectionAcknowledgement || !disclaimers.reportDisclaimer) {
    throw new Error("legal/disclaimers.json is missing required disclaimer text.");
  }
  if (!Array.isArray(riskPolicy.officialStopConditions)) {
    throw new Error("policy/risk-policy.json is missing officialStopConditions.");
  }

  await validateChecksums();

  console.log(`Dataset ${manifest.version} (data/iphone/${DATASET_VERSION_DIR || "."}) passed validation.`);
  console.log(JSON.stringify(manifest.counts ?? {}, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
