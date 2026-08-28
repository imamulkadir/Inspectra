// Consumes inspections/follow-up-rules.json. Recomputed from scratch after
// every answer (cheap — 15 entries) rather than incrementally, which makes
// duplicate-insertion and loop prevention trivial: the result is always the
// full, deduplicated set implied by the CURRENT answers, never an
// accumulation of past runs (section 16).
export function resolveFollowUps({ followUps, answers, ruleById }) {
  const extraRuleIds = new Set();
  const triggeredFollowUps = [];

  for (const followUp of followUps ?? []) {
    const trigger = followUp.trigger ?? {};
    const matches = [];

    if (trigger.ruleId) {
      const answer = answers[trigger.ruleId];
      if (answer && triggerSatisfied(trigger, answer)) {
        matches.push(trigger.ruleId);
      }
    } else if (trigger.ruleIdPattern) {
      const pattern = new RegExp(trigger.ruleIdPattern);
      for (const [ruleId, answer] of Object.entries(answers)) {
        if (pattern.test(ruleId) && triggerSatisfied(trigger, answer)) {
          matches.push(ruleId);
        }
      }
    }

    if (matches.length === 0) continue;

    const newlyAdded = (followUp.addRuleIds ?? []).filter(
      (ruleId) => ruleById.has(ruleId) && !extraRuleIds.has(ruleId),
    );
    for (const ruleId of followUp.addRuleIds ?? []) extraRuleIds.add(ruleId);

    triggeredFollowUps.push({
      followUpId: followUp.id,
      message: followUp.message,
      triggeredByRuleIds: matches,
      addedRuleIds: newlyAdded,
      officialStopCondition: followUp.officialStopCondition ?? false,
    });
  }

  return { extraRuleIds, triggeredFollowUps };
}

function triggerSatisfied(trigger, answer) {
  if (trigger.nonEmptyObservation) {
    return answer.value !== undefined && answer.value !== null && String(answer.value).trim() !== "";
  }
  if (trigger.answerOptionIds) {
    return trigger.answerOptionIds.includes(answer.optionId);
  }
  return false;
}
