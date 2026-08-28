// Official stop conditions are honored EXACTLY as configured in
// policy/risk-policy.json — never inferred from a rule's own
// officialStopCondition flag alone, since a rule can be flagged in the
// dataset while the policy file has not yet approved it as a grounded
// trigger (section 18.2). Today only reset.locked-to-owner is grounded.
export function evaluateOfficialStopConditions(riskPolicy, answers) {
  return (riskPolicy?.officialStopConditions ?? [])
    .filter((condition) => {
      const answer = answers[condition.ruleId];
      return condition.triggerAnswerOptionIds.includes(answer?.optionId);
    })
    .map((condition) => ({
      ruleId: condition.ruleId,
      level: condition.level,
      message: condition.message,
      sourceIds: condition.sourceIds ?? [],
    }));
}

// Rules flagged as requiring product/legal policy approval (section 18.2)
// are surfaced as a review flag, never silently assigned a risk level the
// dataset has not approved.
export function evaluatePolicyReviewFlags(riskPolicy, answers, ruleById) {
  const flagged = [];
  const candidateIds = new Set([
    ...(riskPolicy?.safetyCriticalCandidatesRequiringPolicyApproval ?? []),
    ...(riskPolicy?.transactionCriticalCandidatesRequiringPolicyApproval ?? []),
  ]);

  for (const ruleId of candidateIds) {
    const answer = answers[ruleId];
    if (!answer || answer.adverse !== true) continue;
    flagged.push({
      ruleId,
      title: ruleById.get(ruleId)?.title ?? ruleId,
      message: "Immediate review required. This check is flagged for policy review and has not yet been assigned an approved risk level.",
    });
  }

  return flagged;
}
