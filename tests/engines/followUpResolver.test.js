import { describe, it, expect } from "vitest";
import { resolveFollowUps } from "../../src/engines/followUpResolver.js";
import { followUps, ruleById } from "../fixtures/sampleDataset.js";

describe("resolveFollowUps", () => {
  it("adds the follow-up target rule when the trigger answer matches", () => {
    const answers = { "identity.face-id-setup": { optionId: "no" } };
    const { extraRuleIds, triggeredFollowUps } = resolveFollowUps({ followUps, answers, ruleById });
    expect(extraRuleIds.has("biometrics.face-id-unlock")).toBe(true);
    expect(triggeredFollowUps).toHaveLength(1);
  });

  it("does not trigger when the answer does not match the configured options", () => {
    const answers = { "identity.face-id-setup": { optionId: "yes" } };
    const { extraRuleIds } = resolveFollowUps({ followUps, answers, ruleById });
    expect(extraRuleIds.size).toBe(0);
  });

  it("is idempotent — recomputing from the same answers never duplicates", () => {
    const answers = { "identity.face-id-setup": { optionId: "no" } };
    const first = resolveFollowUps({ followUps, answers, ruleById });
    const second = resolveFollowUps({ followUps, answers, ruleById });
    expect([...first.extraRuleIds]).toEqual([...second.extraRuleIds]);
  });

  it("ignores an unanswered trigger rule", () => {
    const { extraRuleIds } = resolveFollowUps({ followUps, answers: {}, ruleById });
    expect(extraRuleIds.size).toBe(0);
  });
});
