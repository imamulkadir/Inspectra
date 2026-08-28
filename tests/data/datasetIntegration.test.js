import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DATASET_VERSION_DIR } from "../../src/generated/datasetPath.js";

// Section 30.2 — integration tests against the ACTUAL supplied dataset, not
// copied mock facts. Confirms every reference used at runtime resolves.
const root = path.resolve("data/iphone", DATASET_VERSION_DIR);

async function loadJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

describe("supplied dataset referential integrity", () => {
  it("every indexed device resolves to a full catalog device", async () => {
    const index = await loadJson("devices/device-index.json");
    const catalog = await loadJson("devices/device-catalog.json");
    const catalogIds = new Set(catalog.devices.map((d) => d.id));
    for (const entry of index.devices) {
      expect(catalogIds.has(entry.id)).toBe(true);
    }
  });

  it("every regional variant references a valid device and a normalized A-number", async () => {
    const variants = await loadJson("variants/regional-variants.json");
    const catalog = await loadJson("devices/device-catalog.json");
    const deviceIds = new Set(catalog.devices.map((d) => d.id));
    for (const variant of variants.variants) {
      expect(deviceIds.has(variant.deviceId)).toBe(true);
      expect(variant.aNumber).toMatch(/^A\d{4}$/);
    }
  });

  it("every device's finishIds resolve in the finish catalog", async () => {
    const catalog = await loadJson("devices/device-catalog.json");
    const finishes = await loadJson("finishes/finish-catalog.json");
    const finishIds = new Set(finishes.finishes.map((f) => f.id));
    for (const device of catalog.devices) {
      for (const finishId of device.finishIds ?? []) {
        expect(finishIds.has(finishId)).toBe(true);
      }
    }
  });

  it("every model-capabilities record references a valid device", async () => {
    const capabilities = await loadJson("capabilities/model-capabilities.json");
    const catalog = await loadJson("devices/device-catalog.json");
    const deviceIds = new Set(catalog.devices.map((d) => d.id));
    for (const entry of capabilities.models) {
      expect(deviceIds.has(entry.deviceId)).toBe(true);
    }
  });

  it("every rule's category and answer set resolve", async () => {
    const rules = await loadJson("inspections/rules.json");
    const categories = await loadJson("inspections/categories.json");
    const answers = await loadJson("inspections/answer-options.json");
    const categoryIds = new Set(categories.categories.map((c) => c.id));
    const answerSetIds = new Set(answers.answerSets.map((a) => a.id));
    for (const rule of rules.rules) {
      expect(categoryIds.has(rule.categoryId)).toBe(true);
      expect(answerSetIds.has(rule.answerSetId)).toBe(true);
    }
  });

  it("every non-null rule navigationId resolves in settings-paths.json", async () => {
    const rules = await loadJson("inspections/rules.json");
    const navigation = await loadJson("navigation/settings-paths.json");
    const navigationIds = new Set(navigation.paths.map((p) => p.id));
    for (const rule of rules.rules) {
      if (rule.navigationId) expect(navigationIds.has(rule.navigationId)).toBe(true);
    }
  });

  it("every follow-up target rule id exists", async () => {
    const followUps = await loadJson("inspections/follow-up-rules.json");
    const rules = await loadJson("inspections/rules.json");
    const ruleIds = new Set(rules.rules.map((r) => r.id));
    for (const followUp of followUps.followUps) {
      for (const ruleId of followUp.addRuleIds ?? []) {
        expect(ruleIds.has(ruleId)).toBe(true);
      }
    }
  });

  it("every rule sourceId resolves in sources.json", async () => {
    const rules = await loadJson("inspections/rules.json");
    const sources = await loadJson("sources/sources.json");
    const sourceIds = new Set(sources.sources.map((s) => s.id));
    for (const rule of rules.rules) {
      for (const sourceId of rule.sourceIds ?? []) {
        expect(sourceIds.has(sourceId)).toBe(true);
      }
    }
  });

  it("the risk policy's official stop condition rule id exists in rules.json", async () => {
    const riskPolicy = await loadJson("policy/risk-policy.json");
    const rules = await loadJson("inspections/rules.json");
    const ruleIds = new Set(rules.rules.map((r) => r.id));
    for (const condition of riskPolicy.officialStopConditions) {
      expect(ruleIds.has(condition.ruleId)).toBe(true);
    }
  });

  it("uncalibrated policy null values are preserved, never silently replaced with a guess", async () => {
    const scoringPolicy = await loadJson("policy/scoring-policy.json");
    expect(scoringPolicy.requiresCalibration).toBe(true);
    for (const weight of Object.values(scoringPolicy.categoryWeights)) {
      expect(weight).toBeNull();
    }
  });

  it("manifest reports validationStatus PASS", async () => {
    const manifest = await loadJson("manifest.json");
    expect(manifest.validationStatus).toBe("PASS");
  });
});
