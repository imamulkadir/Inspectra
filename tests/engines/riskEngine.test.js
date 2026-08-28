import { describe, it, expect } from "vitest";
import { evaluateOfficialStopConditions } from "../../src/engines/riskEngine.js";
import { riskPolicy } from "../fixtures/sampleDataset.js";

describe("evaluateOfficialStopConditions", () => {
  it("triggers the Activation Lock stop condition on the exact configured answer", () => {
    const answers = { "reset.locked-to-owner": { optionId: "yes" } };
    const result = evaluateOfficialStopConditions(riskPolicy, answers);
    expect(result).toHaveLength(1);
    expect(result[0].level).toBe("CRITICAL");
  });

  it("does not trigger on a different answer to the same rule", () => {
    const answers = { "reset.locked-to-owner": { optionId: "no" } };
    expect(evaluateOfficialStopConditions(riskPolicy, answers)).toHaveLength(0);
  });

  it("does not trigger when the rule has not been answered", () => {
    expect(evaluateOfficialStopConditions(riskPolicy, {})).toHaveLength(0);
  });

  it("never invents a stop condition for a rule not present in risk-policy.json", () => {
    const answers = { "some.other-rule": { optionId: "yes" } };
    expect(evaluateOfficialStopConditions(riskPolicy, answers)).toHaveLength(0);
  });
});
