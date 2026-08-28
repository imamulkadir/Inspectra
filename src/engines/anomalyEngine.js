import { createId } from "../utils/ids.js";
import { PROVENANCE, COMPARISON_OUTCOME } from "../core/constants.js";

// Anomalies validate relationships between fields (section 17). Every
// anomaly gets severityLabel "NEEDS_REVIEW" unless a future calibrated risk
// policy explicitly grounds a different label — never invent a severity.
// One inconsistency is never enough on its own to conclude counterfeit
// status; that judgement is left to the buyer, the wording only flags it.
function createAnomaly({ type, expected, observed, message, sourceIds = [], triggeredRuleIds = [], provenance }) {
  return {
    id: createId("anomaly"),
    type,
    severityLabel: "NEEDS_REVIEW",
    expected,
    observed,
    provenance,
    message,
    sourceIds,
    triggeredRuleIds,
  };
}

export function anomalyFromComparison({ rule, observed, expectedValue, outcome, provenance }) {
  if (outcome !== COMPARISON_OUTCOME.MISMATCH) return null;

  return createAnomaly({
    type: rule.id,
    expected: expectedValue,
    observed,
    message: `The observed value for "${rule.title}" does not match the official dataset value. Recheck the entry and, if it persists, investigate further before relying on this alone.`,
    sourceIds: rule.sourceIds,
    triggeredRuleIds: [rule.id],
    provenance,
  });
}

export function anomalyFromModelANumberMismatch(consistency) {
  if (!consistency || consistency.consistent) return null;
  return createAnomaly({
    type: "model_anumber_mismatch",
    expected: consistency.selectedDeviceId,
    observed: consistency.aNumberDeviceId,
    message: consistency.message,
    provenance: PROVENANCE.USER_OBSERVATION,
  });
}

export function anomalyFromStorageObservation({ device, observedStorageGB, isOther }) {
  if (!isOther && (observedStorageGB == null || device?.storageGB?.includes(observedStorageGB))) {
    return null;
  }
  return createAnomaly({
    type: "storage_mismatch",
    expected: device?.storageGB ?? [],
    observed: isOther ? "Other / does not match" : observedStorageGB,
    message:
      "The reported storage capacity is not among the official storage options for the selected model. Recheck the selected model and the reported capacity.",
    sourceIds: device?.sourceIds ?? [],
    provenance: PROVENANCE.USER_OBSERVATION,
  });
}

export function anomalyFromFinishObservation({ device, observedFinishName, isOther }) {
  if (!isOther && (observedFinishName == null || device?.officialFinishNames?.includes(observedFinishName))) {
    return null;
  }
  return createAnomaly({
    type: "finish_mismatch",
    expected: device?.officialFinishNames ?? [],
    observed: isOther ? "Other / not listed" : observedFinishName,
    message:
      "The reported exterior finish is not in the official finish list for the selected model. Recheck the selected model and investigate possible housing replacement or modification.",
    sourceIds: device?.sourceIds ?? [],
    provenance: PROVENANCE.USER_OBSERVATION,
  });
}

export function anomalyFromMeasuredWeight({ device, measuredGrams }) {
  if (measuredGrams == null || device?.weightGrams == null) return null;
  const differenceGrams = Math.abs(measuredGrams - device.weightGrams);
  if (differenceGrams === 0) return null;

  return createAnomaly({
    type: "weight_difference",
    expected: device.weightGrams,
    observed: measuredGrams,
    message: `The measured weight differs from the official weight by ${differenceGrams} g. This is a raw comparison, not an automatic authenticity conclusion: no threshold is applied until a calibrated policy exists.`,
    sourceIds: device.sourceIds ?? [],
    provenance: PROVENANCE.USER_OBSERVATION,
  });
}
