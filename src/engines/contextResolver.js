// Builds the single inspection context object consumed by the rule
// resolver, expected-value resolver, navigation resolver, and anomaly
// engine — the four resolvers that must agree on "what device, variant,
// iOS, and capabilities are we inspecting" (section 9/12).
export function buildInspectionContext({
  device,
  variant,
  storage,
  finish,
  iosVersionInput,
  iosParsed,
  capabilitiesRecord,
  identityInconsistencies = [],
}) {
  return {
    deviceId: device?.id ?? null,
    device: device ?? null,
    variantId: variant?.id ?? null,
    variant: variant ?? null,
    storage: storage ?? null,
    finish: finish ?? null,
    iosVersionInput: iosVersionInput ?? null,
    iosParsed: iosParsed ?? null,
    capabilitiesRecord: capabilitiesRecord ?? null,
    identityInconsistencies,
  };
}

export function isContextReadyForInspection(context) {
  return Boolean(context?.device && context?.iosParsed);
}
