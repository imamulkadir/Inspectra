// Minimal synthetic fixtures mirroring the real dataset's field shapes
// (confirmed against data/iphone/v1.0.0/) for fast, isolated engine tests.
export const devices = [
  {
    id: "iphone-17-pro",
    marketingName: "iPhone 17 Pro",
    family: "iPhone 17",
    segment: "pro",
    introducedYear: 2025,
    storageGB: [256, 512, 1024],
    officialFinishNames: ["Silver", "Cosmic Orange", "Deep Blue"],
    weightGrams: 206,
    connector: { type: "USB-C" },
    sourceIds: ["apple-tech-spec-iphone-17-pro"],
  },
  {
    id: "iphone-se-2",
    marketingName: "iPhone SE (2nd generation)",
    family: "iPhone SE",
    segment: "se",
    introducedYear: 2020,
    storageGB: [64, 128, 256],
    officialFinishNames: ["Black", "White", "(PRODUCT)RED"],
    weightGrams: 148,
    connector: { type: "Lightning" },
    sourceIds: ["apple-tech-spec-iphone-se-2"],
  },
];

export const variantByANumberFixture = {
  A2894: { id: "iphone-17-pro-a2894", deviceId: "iphone-17-pro", aNumber: "A2894", marketGroupLabel: "United States" },
};

export const capabilitiesByDeviceIdFixture = {
  "iphone-17-pro": {
    deviceId: "iphone-17-pro",
    capabilities: { faceId: true, touchId: false, actionButton: true, cameraControl: true },
  },
  "iphone-se-2": {
    deviceId: "iphone-se-2",
    capabilities: { faceId: false, touchId: true, actionButton: false, cameraControl: false },
  },
};

export const categories = [
  { id: "identity", name: "Identity", order: 1 },
  { id: "biometrics_sensors", name: "Biometrics & sensors", order: 2 },
  { id: "ownership_security", name: "Ownership, Activation & Management", order: 3 },
  { id: "physical_condition", name: "Physical Condition", order: 4 },
];
export const categoryById = new Map(categories.map((c) => [c.id, c]));

export const answerSets = {
  yes_no_unknown: {
    id: "yes_no_unknown",
    options: [
      { id: "yes", label: "Yes", status: "PASS" },
      { id: "no", label: "No", status: "FAIL" },
      { id: "not_tested", label: "Not tested", status: "NOT_TESTED" },
      { id: "unknown", label: "Can't determine", status: "UNKNOWN" },
    ],
  },
  numeric_observation: { id: "numeric_observation", inputType: "number" },
};

function baseRule(overrides) {
  return {
    id: "rule.base",
    categoryId: "identity",
    title: "Base rule",
    question: "Base question?",
    method: "guided_manual",
    priority: "high",
    answerSetId: "yes_no_unknown",
    navigationId: null,
    applicability: { capabilityAll: [], capabilityAny: [], capabilityNone: [], iosMin: null, modelIds: [], variantCondition: null },
    expected: null,
    evidenceAllowed: [],
    sourceIds: [],
    basisType: "guided_observation",
    officialStopCondition: false,
    scoring: { weight: null, passPoints: null, failPenalty: null, warningPenalty: null, requiresCalibration: true },
    risk: { severity: null, requiresProductPolicyReview: false },
    interpretationPolicy: "test",
    notes: [],
    answerInterpretation: {
      mode: "rule_specific",
      adverseOptionIds: ["no"],
      positiveOptionIds: ["yes"],
      unknownOptionIds: ["unknown", "not_tested"],
      policyNote: "test",
    },
    ...overrides,
  };
}

export const rules = [
  baseRule({ id: "identity.face-id-setup", categoryId: "identity", priority: "critical", applicability: { capabilityAll: ["faceId"], capabilityAny: [], capabilityNone: [], iosMin: null, modelIds: [], variantCondition: null } }),
  baseRule({ id: "identity.touch-id-setup", categoryId: "identity", priority: "high", applicability: { capabilityAll: ["touchId"], capabilityAny: [], capabilityNone: [], iosMin: null, modelIds: [], variantCondition: null } }),
  baseRule({ id: "identity.model-name", categoryId: "identity", priority: "critical", answerSetId: "yes_no_unknown", expected: { deviceField: "marketingName" } }),
  baseRule({ id: "biometrics.face-id-unlock", categoryId: "biometrics_sensors", priority: "medium", applicability: { capabilityAll: [], capabilityAny: [], capabilityNone: [], iosMin: "16.0", modelIds: [], variantCondition: null } }),
  baseRule({ id: "identity.low-priority-note", categoryId: "identity", priority: "low" }),
  baseRule({ id: "ownership.activation-lock", categoryId: "ownership_security", priority: "critical" }),
  baseRule({ id: "physical.chassis-deformation", categoryId: "physical_condition", priority: "critical" }),
];
export const ruleById = new Map(rules.map((r) => [r.id, r]));

export const followUps = [
  {
    id: "followup-face-id-fail",
    trigger: { ruleId: "identity.face-id-setup", answerOptionIds: ["no"] },
    addRuleIds: ["biometrics.face-id-unlock"],
    message: "Face ID setup failed — check unlock behavior too.",
  },
];

export const riskPolicy = {
  version: "test",
  officialStopConditions: [
    {
      ruleId: "reset.locked-to-owner",
      triggerAnswerOptionIds: ["yes"],
      level: "CRITICAL",
      sourceIds: ["apple-preowned-iphone-guide"],
      message: "Apple advises not to take ownership of an iPhone protected by Activation Lock.",
    },
  ],
  safetyCriticalCandidatesRequiringPolicyApproval: [],
  transactionCriticalCandidatesRequiringPolicyApproval: [],
};

export const scoringPolicy = {
  requiresCalibration: true,
  categoryWeights: { identity: null, biometrics_sensors: null },
};

export const coveragePolicy = {
  requiresCalibration: true,
  confidenceThresholds: null,
};
