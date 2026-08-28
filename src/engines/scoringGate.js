// Numeric scoring/confidence gates (section 18.1, 18.4). The current
// dataset's scoring-policy.json and coverage-confidence-policy.json both set
// requiresCalibration:true with every weight/threshold null — these gates
// must return false today and flip on automatically once a future dataset
// release supplies real numbers, without any page component changing.
export function isNumericScoringAvailable(scoringPolicy) {
  if (!scoringPolicy || scoringPolicy.requiresCalibration !== false) return false;

  const weights = Object.values(scoringPolicy.categoryWeights ?? {});
  if (weights.length === 0 || !weights.every((w) => typeof w === "number" && Number.isFinite(w))) {
    return false;
  }

  const total = weights.reduce((sum, value) => sum + value, 0);
  return Math.abs(total - 1) < 0.000001;
}

export function isConfidenceCalibrated(coveragePolicy) {
  if (!coveragePolicy || coveragePolicy.requiresCalibration !== false) return false;
  return coveragePolicy.confidenceThresholds != null;
}

// Hard rules (section 18.4) evaluated even while confidence bands remain
// uncalibrated — they gate what limitations must be listed, not a score.
export function evaluateConfidenceHardRules({
  orderedRuleIds,
  ruleById,
  answers,
  resetVerificationCompleted,
}) {
  const limitations = [];

  const criticalUnresolved = orderedRuleIds.filter((ruleId) => {
    const rule = ruleById.get(ruleId);
    if (rule?.priority !== "critical") return false;
    const status = answers[ruleId]?.status;
    return status == null || status === "NOT_TESTED" || status === "UNKNOWN";
  });

  if (criticalUnresolved.length > 0) {
    limitations.push(
      `${criticalUnresolved.length} applicable critical check${criticalUnresolved.length === 1 ? "" : "s"} ${criticalUnresolved.length === 1 ? "was" : "were"} not completed.`,
    );
  }

  if (!resetVerificationCompleted) {
    limitations.push("Final reset verification was not completed.");
  }

  return { limitations, confidenceCanBeHigh: criticalUnresolved.length === 0 && resetVerificationCompleted };
}
