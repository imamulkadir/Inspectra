// Product-configured inspection breadth. This mapping is an application
// product decision, not a dataset fact and not a modification of
// data/iphone/ — the dataset only supplies rule.priority and rule.categoryId.

export const INSPECTION_PROFILES = Object.freeze({
  quick: {
    id: "quick",
    label: "Quick check",
    description: "The fastest way to catch an official stop condition or a hidden liquid-exposure indicator.",
    includedPriorities: ["critical"],
    includedCategories: ["ownership_security", "liquid_exposure"],
  },

  standard: {
    id: "standard",
    label: "Standard inspection",
    description: "Essential checks covering the most important things to verify before buying a used iPhone.",
    // Standard used to be a priority+category filter like quick/deep below,
    // but that made it hard to reason about exactly what a buyer would be
    // asked. It's now a curated allowlist instead — every id below was
    // picked individually as the single most essential check for its
    // concept, not derived from priority/category. See
    // ruleIncludedInProfile: when explicitRuleIds is present, it's the
    // *only* thing that decides membership for that profile.
    //
    // The Face ID / Touch ID pairs (enrollment and unlock) are the one
    // deliberate exception to "one id per concept" — both variants are
    // listed because a real device only ever has one of the two, and the
    // applicability engine already hides whichever doesn't match that
    // device's biometric hardware, so listing both doesn't change what an
    // actual inspection shows.
    explicitRuleIds: [
      "identity.model-name",
      "identity.a-number",
      "identity.capacity",
      "security.find-my-status",
      "security.activation-locked-screen",
      "security.seller-can-sign-out",
      "security.remote-management-after-reset",
      "parts.section-availability",
      "parts.biometric-after-repair",
      "battery.service-recommendation",
      "battery.charging-starts",
      "battery.back-lift",
      "display.touch-grid",
      "display.ghost-touch",
      "camera.main",
      "camera.front",
      "biometrics.face-id-enrollment",
      "biometrics.touch-id-enrollment",
      "biometrics.face-id-unlock",
      "biometrics.touch-id-unlock",
      "control.side-button",
      "charging.port-visual",
      "charging.wired",
      "connectivity.sim-detected",
      "connectivity.wifi-connect",
      "liquid.lci",
      "liquid.port-corrosion",
      "software.restart",
    ],
  },

  deep: {
    id: "deep",
    label: "Deep inspection",
    description: "Every applicable check the dataset supports for this device, including physical condition, parts history, and exact spec matching.",
    includedPriorities: ["critical", "high", "medium", "low"],
    includedCategories: null,
  },
});

export const DEFAULT_PROFILE_ID = "standard";

const KNOWN_PRIORITIES = ["critical", "high", "medium", "low"];

export function ruleIncludedInProfile(rule, profileId) {
  const profile = INSPECTION_PROFILES[profileId];
  if (!profile) return false;

  if (profile.explicitRuleIds) {
    return profile.explicitRuleIds.includes(rule.id);
  }

  if (!KNOWN_PRIORITIES.includes(rule.priority)) {
    // An unknown priority (future dataset addition) is included only in
    // Deep, with a non-blocking developer warning.
    if (profileId !== "deep") return false;
    console.warn(`[Inspectra] Unknown rule priority "${rule.priority}" included in Deep profile only.`);
    return true;
  }

  if (!profile.includedPriorities.includes(rule.priority)) return false;
  if (profile.includedCategories && !profile.includedCategories.includes(rule.categoryId)) return false;

  return true;
}
