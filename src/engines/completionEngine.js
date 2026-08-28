import { ANSWER_STATUS } from "../core/constants.js";
import { RECORDED_STATUS } from "./answerInterpreter.js";

// Raw, transparent checklist completion (section 18.3) — priority weights
// are null in the current dataset, so this is deliberately NOT presented as
// "weighted inspection coverage."
export function computeChecklistCompletion(orderedRuleIds, answers) {
  const counts = {
    completed: 0,
    needsAttention: 0,
    unresolved: 0,
    notTested: 0,
    unavailable: 0,
    notApplicable: 0,
  };

  for (const ruleId of orderedRuleIds) {
    const status = answers[ruleId]?.status ?? ANSWER_STATUS.NOT_TESTED;

    switch (status) {
      case ANSWER_STATUS.PASS:
      case RECORDED_STATUS:
        counts.completed += 1;
        break;
      case ANSWER_STATUS.FAIL:
      case ANSWER_STATUS.WARNING:
        counts.needsAttention += 1;
        break;
      case ANSWER_STATUS.UNKNOWN:
        counts.unresolved += 1;
        break;
      case ANSWER_STATUS.UNAVAILABLE:
        counts.unavailable += 1;
        break;
      case ANSWER_STATUS.NOT_APPLICABLE:
        counts.notApplicable += 1;
        break;
      case ANSWER_STATUS.NOT_TESTED:
      default:
        counts.notTested += 1;
        break;
    }
  }

  const denominator = orderedRuleIds.length - counts.unavailable - counts.notApplicable;
  const numerator = counts.completed + counts.needsAttention;
  const ratio = denominator > 0 ? numerator / denominator : null;

  return { ...counts, total: orderedRuleIds.length, denominator, numerator, ratio };
}

export function computeCategorySummaries(orderedRuleIds, answers, ruleById, categoryById) {
  const byCategory = new Map();

  for (const ruleId of orderedRuleIds) {
    const rule = ruleById.get(ruleId);
    if (!rule) continue;
    const categoryId = rule.categoryId;
    if (!byCategory.has(categoryId)) {
      byCategory.set(categoryId, {
        categoryId,
        name: categoryById.get(categoryId)?.name ?? categoryId,
        order: categoryById.get(categoryId)?.order ?? 0,
        ruleIds: [],
      });
    }
    byCategory.get(categoryId).ruleIds.push(ruleId);
  }

  return Array.from(byCategory.values())
    .map((entry) => ({
      ...entry,
      completion: computeChecklistCompletion(entry.ruleIds, answers),
    }))
    .sort((a, b) => a.order - b.order);
}
