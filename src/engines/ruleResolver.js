import { RULE_APPLICABILITY } from "../core/constants.js";
import {
  capabilityAllSatisfied,
  capabilityAnySatisfied,
  capabilityNoneSatisfied,
} from "./capabilityResolver.js";
import { isVersionInRange } from "../utils/version.js";
import { getByPath } from "../utils/objectPath.js";
import { ruleIncludedInProfile } from "../config/inspectionProfiles.js";

// Resolves whether a single rule applies to the current context, WITHOUT
// considering the inspection profile — profile filtering is a separate,
// later step so a follow-up-triggered rule can still be added outside the
// original profile (section 13). Never mutates the rule object.
export function resolveRuleApplicability(rule, context) {
  const reasons = [];
  let deferred = false;

  const { applicability } = rule;

  if (applicability.modelIds?.length) {
    if (!context.device) {
      deferred = true;
      reasons.push("Device not yet resolved.");
    } else if (!applicability.modelIds.includes(context.device.id)) {
      return { status: RULE_APPLICABILITY.NOT_APPLICABLE, reasons: ["Not applicable to this model."] };
    }
  }

  if (applicability.iosMin) {
    if (!context.iosParsed) {
      deferred = true;
      reasons.push("iOS version not yet entered.");
    } else {
      const inRange = isVersionInRange(context.iosParsed, applicability.iosMin, null);
      if (inRange === false) {
        return {
          status: RULE_APPLICABILITY.NOT_APPLICABLE,
          reasons: [`Requires iOS ${applicability.iosMin} or later.`],
        };
      }
      if (inRange === null) deferred = true;
    }
  }

  if (applicability.capabilityAll?.length) {
    const result = capabilityAllSatisfied(context.capabilitiesRecord, applicability.capabilityAll);
    if (result === false) {
      return { status: RULE_APPLICABILITY.NOT_APPLICABLE, reasons: ["Required capability not present on this model."] };
    }
    if (result === null) {
      deferred = true;
      reasons.push("Capability data not yet resolved.");
    }
  }

  if (applicability.capabilityAny?.length) {
    const result = capabilityAnySatisfied(context.capabilitiesRecord, applicability.capabilityAny);
    if (result === false) {
      return { status: RULE_APPLICABILITY.NOT_APPLICABLE, reasons: ["No matching capability present on this model."] };
    }
    if (result === null) {
      deferred = true;
      reasons.push("Capability data not yet resolved.");
    }
  }

  if (applicability.capabilityNone?.length) {
    const result = capabilityNoneSatisfied(context.capabilitiesRecord, applicability.capabilityNone);
    if (result === false) {
      return { status: RULE_APPLICABILITY.NOT_APPLICABLE, reasons: ["Excluded capability is present on this model."] };
    }
    if (result === null) {
      deferred = true;
      reasons.push("Capability data not yet resolved.");
    }
  }

  if (applicability.variantCondition) {
    if (!context.variant) {
      deferred = true;
      reasons.push("Regional variant not yet resolved.");
    } else {
      for (const [field, expected] of Object.entries(applicability.variantCondition)) {
        const actual = getByPath(context.variant, field);
        if (actual === null || actual === undefined) {
          deferred = true;
          reasons.push(`Variant field "${field}" is unknown.`);
        } else if (actual !== expected) {
          return {
            status: RULE_APPLICABILITY.NOT_APPLICABLE,
            reasons: [`Requires variant.${field} = ${expected}.`],
          };
        }
      }
    }
  }

  return {
    status: deferred ? RULE_APPLICABILITY.DEFERRED : RULE_APPLICABILITY.APPLICABLE,
    reasons,
  };
}

// Ordering: category order, then priority rank, then original dataset
// order as a stable tie-breaker (section 14.2).
const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export function buildRuleQueue({
  rules,
  context,
  profileId,
  categoryById,
  extraRuleIds = new Set(),
}) {
  const applicable = [];
  const deferred = [];
  const notApplicable = [];

  rules.forEach((rule, datasetIndex) => {
    const { status, reasons } = resolveRuleApplicability(rule, context);
    const inProfile = ruleIncludedInProfile(rule, profileId) || extraRuleIds.has(rule.id);

    if (status === RULE_APPLICABILITY.NOT_APPLICABLE) {
      notApplicable.push({ rule, reasons });
      return;
    }
    if (status === RULE_APPLICABILITY.DEFERRED) {
      deferred.push({ rule, reasons });
      return;
    }
    if (!inProfile) return;

    applicable.push({
      rule,
      datasetIndex,
      categoryOrder: categoryById.get(rule.categoryId)?.order ?? Number.MAX_SAFE_INTEGER,
      priorityRank: PRIORITY_RANK[rule.priority] ?? 99,
    });
  });

  applicable.sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    return a.datasetIndex - b.datasetIndex;
  });

  return {
    orderedRuleIds: applicable.map((entry) => entry.rule.id),
    deferred,
    notApplicable,
  };
}
