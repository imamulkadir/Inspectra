import { describe, it, expect } from "vitest";
import { computeChecklistCompletion } from "../../src/engines/completionEngine.js";
import { ANSWER_STATUS } from "../../src/core/constants.js";

describe("computeChecklistCompletion", () => {
  it("excludes NOT_APPLICABLE and UNAVAILABLE from the denominator", () => {
    const orderedRuleIds = ["a", "b", "c", "d"];
    const answers = {
      a: { status: ANSWER_STATUS.PASS },
      b: { status: ANSWER_STATUS.NOT_APPLICABLE },
      c: { status: ANSWER_STATUS.UNAVAILABLE },
      d: { status: ANSWER_STATUS.NOT_TESTED },
    };
    const result = computeChecklistCompletion(orderedRuleIds, answers);
    expect(result.denominator).toBe(2); // a + d
    expect(result.completed).toBe(1);
    expect(result.notTested).toBe(1);
  });

  it("never counts NOT_TESTED or UNKNOWN as completed", () => {
    const result = computeChecklistCompletion(["a", "b"], {
      a: { status: ANSWER_STATUS.NOT_TESTED },
      b: { status: ANSWER_STATUS.UNKNOWN },
    });
    expect(result.completed).toBe(0);
    expect(result.ratio).toBe(0);
  });

  it("treats an unanswered rule as NOT_TESTED by default", () => {
    const result = computeChecklistCompletion(["a"], {});
    expect(result.notTested).toBe(1);
  });

  it("returns a null ratio when the denominator is zero", () => {
    const result = computeChecklistCompletion(["a"], { a: { status: ANSWER_STATUS.NOT_APPLICABLE } });
    expect(result.denominator).toBe(0);
    expect(result.ratio).toBeNull();
  });
});
