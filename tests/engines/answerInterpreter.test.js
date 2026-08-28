import { describe, it, expect } from "vitest";
import { interpretAnswer, RECORDED_STATUS } from "../../src/engines/answerInterpreter.js";
import { ANSWER_OUTCOME, ANSWER_STATUS } from "../../src/core/constants.js";
import { rules, answerSets } from "../fixtures/sampleDataset.js";

const rule = rules.find((r) => r.id === "identity.face-id-setup"); // adverse: no, positive: yes
const yesNo = answerSets.yes_no_unknown;

describe("interpretAnswer", () => {
  it("classifies a positive option as POSITIVE using rule-level policy", () => {
    const result = interpretAnswer(rule, yesNo, { optionId: "yes" });
    expect(result.outcome).toBe(ANSWER_OUTCOME.POSITIVE);
    expect(result.positive).toBe(true);
    expect(result.status).toBe(ANSWER_STATUS.PASS);
  });

  it("classifies an adverse option as ADVERSE even though the same option id could be positive on another rule", () => {
    const result = interpretAnswer(rule, yesNo, { optionId: "no" });
    expect(result.outcome).toBe(ANSWER_OUTCOME.ADVERSE);
    expect(result.adverse).toBe(true);
  });

  it("never converts NOT_TESTED/UNKNOWN into a completed status", () => {
    const notTested = interpretAnswer(rule, yesNo, { optionId: "not_tested" });
    const unknown = interpretAnswer(rule, yesNo, { optionId: "unknown" });
    expect(notTested.unresolved).toBe(true);
    expect(unknown.unresolved).toBe(true);
    expect(notTested.status).not.toBe(ANSWER_STATUS.PASS);
    expect(unknown.status).not.toBe(ANSWER_STATUS.PASS);
  });

  it("marks unable-to-verify as UNKNOWN/unresolved regardless of answer set", () => {
    const result = interpretAnswer(rule, yesNo, { unableToVerify: true });
    expect(result.status).toBe(ANSWER_STATUS.UNKNOWN);
    expect(result.unresolved).toBe(true);
  });

  it("treats a numeric/text observation as RECORDED (not PASS) when a value is present", () => {
    const numericRule = { ...rule, answerInterpretation: { mode: "observation_only", adverseOptionIds: [], positiveOptionIds: [], unknownOptionIds: [] } };
    const result = interpretAnswer(numericRule, answerSets.numeric_observation, { value: "97" });
    expect(result.status).toBe(RECORDED_STATUS);
    expect(result.status).not.toBe(ANSWER_STATUS.PASS);
    expect(result.unresolved).toBe(false);
  });

  it("treats an empty numeric/text observation as NOT_TESTED", () => {
    const numericRule = { ...rule, answerInterpretation: { mode: "observation_only", adverseOptionIds: [], positiveOptionIds: [], unknownOptionIds: [] } };
    const result = interpretAnswer(numericRule, answerSets.numeric_observation, { value: "" });
    expect(result.status).toBe(ANSWER_STATUS.NOT_TESTED);
    expect(result.unresolved).toBe(true);
  });
});
