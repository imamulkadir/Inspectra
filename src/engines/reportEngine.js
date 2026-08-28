import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/dates.js";
import { APP_VERSION } from "../config/appConfig.js";
import { computeChecklistCompletion, computeCategorySummaries } from "./completionEngine.js";
import { evaluateOfficialStopConditions, evaluatePolicyReviewFlags } from "./riskEngine.js";
import { isNumericScoringAvailable, isConfidenceCalibrated, evaluateConfidenceHardRules } from "./scoringGate.js";
import { resolveSources } from "../data/sourceResolver.js";
import { RECORDED_STATUS } from "./answerInterpreter.js";
import { ANSWER_STATUS } from "../core/constants.js";

export function containsProhibitedPhrase(text, reportLanguage) {
  if (!text) return null;
  const lower = text.toLowerCase();
  return (
    (reportLanguage?.prohibitedAbsolutePhrases ?? []).find((phrase) =>
      lower.includes(phrase.toLowerCase()),
    ) ?? null
  );
}

export function buildReport({ inspection, dataset, indexes, identification }) {
  const { ruleById, categoryById, sourceById } = indexes;
  const {
    scoringPolicy,
    riskPolicy,
    coveragePolicy,
    reportLanguage,
    disclaimers,
    manifest,
  } = dataset;

  const orderedRuleIds = inspection.orderedRuleIds;
  const answers = inspection.answers;

  const officialStopConditions = evaluateOfficialStopConditions(riskPolicy, answers);
  const policyReviewFlags = evaluatePolicyReviewFlags(riskPolicy, answers, ruleById);

  const adverseFindings = [];
  const positiveFindings = [];
  const unresolvedFindings = [];
  const notTestedFindings = [];
  const unavailableFindings = [];

  for (const ruleId of orderedRuleIds) {
    const rule = ruleById.get(ruleId);
    const answer = answers[ruleId];
    const status = answer?.status ?? ANSWER_STATUS.NOT_TESTED;
    const entry = { ruleId, title: rule?.title, categoryId: rule?.categoryId, answer };

    if (status === ANSWER_STATUS.UNAVAILABLE) unavailableFindings.push(entry);
    else if (status === ANSWER_STATUS.NOT_TESTED) notTestedFindings.push(entry);
    else if (answer?.adverse) adverseFindings.push(entry);
    else if (answer?.positive) positiveFindings.push(entry);
    else if (status === ANSWER_STATUS.UNKNOWN) unresolvedFindings.push(entry);
  }

  // Recorded as-is (a plain user observation, section 2.2 bans automated
  // valuation) so it can sit next to the findings for context — not turned
  // into any calculated/expected price.
  const priceContext = answers["transaction.price-context"]?.value ?? null;

  const resetVerificationCompleted = inspection.resetVerification?.completed === true;

  const checklistCompletion = computeChecklistCompletion(orderedRuleIds, answers);
  const categorySummaries = computeCategorySummaries(orderedRuleIds, answers, ruleById, categoryById);

  const confidence = evaluateConfidenceHardRules({
    orderedRuleIds,
    ruleById,
    answers,
    resetVerificationCompleted,
  });

  const provenanceSummary = {};
  for (const answer of Object.values(answers)) {
    const key = answer.provenance ?? "UNKNOWN";
    provenanceSummary[key] = (provenanceSummary[key] ?? 0) + 1;
  }

  const allSourceIds = new Set();
  for (const ruleId of orderedRuleIds) {
    for (const sid of ruleById.get(ruleId)?.sourceIds ?? []) allSourceIds.add(sid);
  }
  const { resolved: sourceSnapshots } = resolveSources([...allSourceIds], sourceById);

  const reportId = createId("report");

  return {
    // `id` is required by the `reports` IndexedDB object store's keyPath
    // (section 22.1) — without it, saveReport()'s store.put() throws
    // "key path did not yield a value" and every report snapshot silently
    // fails to persist. `reportId` is kept too since it's the field name
    // documented in the reporting contract (section 32).
    id: reportId,
    reportId,
    inspectionId: inspection.id,
    generatedAt: nowIso(),
    appVersion: APP_VERSION,
    datasetVersion: manifest?.version ?? null,
    datasetVerifiedAt: manifest?.verifiedAt ?? null,
    policyVersions: {
      scoring: scoringPolicy?.version ?? null,
      risk: riskPolicy?.version ?? null,
      coverage: coveragePolicy?.version ?? null,
      reportLanguage: reportLanguage?.version ?? null,
    },
    disclaimerVersion: disclaimers?.version ?? null,

    inspectionProfile: inspection.profileId,
    priceContext,
    deviceSnapshot: identification.device,
    variantSnapshot: identification.variant,
    iosSnapshot: identification.iosParsed,

    officialStopConditions,
    policyReviewFlags,
    identityFindings: inspection.identityFindings ?? [],
    adverseFindings,
    positiveFindings,
    unresolvedFindings,
    notTestedFindings,
    unavailableFindings,

    checklistCompletion,
    scoringAvailability: isNumericScoringAvailable(scoringPolicy) ? "AVAILABLE" : "NOT_CALIBRATED",
    confidenceAvailability: isConfidenceCalibrated(coveragePolicy) ? "AVAILABLE" : "NOT_CALIBRATED",
    confidenceLimitations: confidence.limitations,
    resetVerification: inspection.resetVerification ?? {},

    categorySummaries,
    provenanceSummary,
    sourceSnapshots,
    methodologyNotes: [
      "Numeric condition scoring is not shown because the dataset's scoring policy requires calibration that has not yet been completed.",
      "Result confidence bands are not shown for the same reason; explicit limitations are listed instead.",
      "Checklist completion is a raw count of completed applicable checks, not a weighted score.",
    ],
    disclaimer: {
      persistentLabel: disclaimers?.persistentLabel,
      reportDisclaimer: disclaimers?.reportDisclaimer,
      scopeLimitations: disclaimers?.scopeLimitations ?? [],
    },
  };
}

export { RECORDED_STATUS };
