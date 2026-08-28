import { describe, it, expect } from "vitest";
import { isNumericScoringAvailable, isConfidenceCalibrated, evaluateConfidenceHardRules } from "../../src/engines/scoringGate.js";
import { scoringPolicy, coveragePolicy, rules } from "../fixtures/sampleDataset.js";

describe("isNumericScoringAvailable", () => {
  it("is false while requiresCalibration is true, matching the current dataset", () => {
    expect(isNumericScoringAvailable(scoringPolicy)).toBe(false);
  });

  it("is false when weights are null even if requiresCalibration were flipped", () => {
    expect(isNumericScoringAvailable({ requiresCalibration: false, categoryWeights: { a: null } })).toBe(false);
  });

  it("is true only when calibration is done and weights sum to 1", () => {
    expect(isNumericScoringAvailable({ requiresCalibration: false, categoryWeights: { a: 0.5, b: 0.5 } })).toBe(true);
  });
});

describe("isConfidenceCalibrated", () => {
  it("is false while the current dataset's thresholds are null", () => {
    expect(isConfidenceCalibrated(coveragePolicy)).toBe(false);
  });
});

describe("evaluateConfidenceHardRules", () => {
  const ruleById = new Map(rules.map((r) => [r.id, r]));

  it("flags confidence as not-high when a critical check is not tested", () => {
    const result = evaluateConfidenceHardRules({
      orderedRuleIds: ["identity.face-id-setup", "identity.model-name"],
      ruleById,
      answers: {},
      resetVerificationCompleted: true,
    });
    expect(result.confidenceCanBeHigh).toBe(false);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("flags confidence as not-high when final reset verification is incomplete", () => {
    const result = evaluateConfidenceHardRules({
      orderedRuleIds: ["identity.face-id-setup"],
      ruleById,
      answers: { "identity.face-id-setup": { status: "PASS" } },
      resetVerificationCompleted: false,
    });
    expect(result.confidenceCanBeHigh).toBe(false);
    expect(result.limitations).toContain("Final reset verification was not completed.");
  });

  it("allows confidenceCanBeHigh when all critical checks resolved and reset completed", () => {
    const result = evaluateConfidenceHardRules({
      orderedRuleIds: ["identity.face-id-setup"],
      ruleById,
      answers: { "identity.face-id-setup": { status: "PASS" } },
      resetVerificationCompleted: true,
    });
    expect(result.confidenceCanBeHigh).toBe(true);
  });
});
