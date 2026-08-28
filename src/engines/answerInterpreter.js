import { ANSWER_STATUS, ANSWER_OUTCOME } from "../core/constants.js";

// Synthetic status for numeric/text observation rules, which the dataset
// deliberately does not assign a PASS/FAIL/WARNING status to (section
// 14.5). It is treated as "completed" by the completion engine without
// implying any quality judgement — never confuse it with PASS.
export const RECORDED_STATUS = "RECORDED";

// Rule-level interpretation (section 14.4) — the generic status on an
// answer option is only a UI default; final classification always uses the
// rule's own answerInterpretation because the same option id can be
// positive on one rule and adverse on another.
export function interpretAnswer(rule, answerSet, selection = {}) {
  const { optionId, value, unableToVerify } = selection;
  const policy = rule.answerInterpretation;

  if (unableToVerify) {
    return {
      outcome: ANSWER_OUTCOME.UNKNOWN,
      status: ANSWER_STATUS.UNKNOWN,
      adverse: false,
      positive: false,
      unresolved: true,
    };
  }

  // Numeric/text free-input rules have no answer options at all.
  if (!answerSet?.options) {
    const hasValue = value !== undefined && value !== null && String(value).trim() !== "";
    return {
      outcome: ANSWER_OUTCOME.OBSERVATION,
      status: hasValue ? RECORDED_STATUS : ANSWER_STATUS.NOT_TESTED,
      adverse: false,
      positive: false,
      unresolved: !hasValue,
    };
  }

  const option = answerSet.options.find((item) => item.id === optionId);
  const status = option?.status ?? ANSWER_STATUS.NOT_TESTED;

  if (policy?.adverseOptionIds?.includes(optionId)) {
    return { outcome: ANSWER_OUTCOME.ADVERSE, status, adverse: true, positive: false, unresolved: false };
  }

  if (policy?.positiveOptionIds?.includes(optionId)) {
    return { outcome: ANSWER_OUTCOME.POSITIVE, status, adverse: false, positive: true, unresolved: false };
  }

  if (policy?.unknownOptionIds?.includes(optionId)) {
    return { outcome: ANSWER_OUTCOME.UNKNOWN, status, adverse: false, positive: false, unresolved: true };
  }

  if (!policy || policy.mode === "observation_only") {
    return { outcome: ANSWER_OUTCOME.OBSERVATION, status, adverse: false, positive: false, unresolved: false };
  }

  return { outcome: ANSWER_OUTCOME.UNCLASSIFIED, status, adverse: false, positive: false, unresolved: true };
}
