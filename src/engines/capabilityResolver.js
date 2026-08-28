// A missing capability key is unknown, not false (section 12). Resolvers
// that need a definite yes/no must treat `undefined` distinctly from `false`.
export function getCapability(capabilitiesRecord, capabilityId) {
  const value = capabilitiesRecord?.capabilities?.[capabilityId];
  return value === undefined ? null : value;
}

export function capabilityAllSatisfied(capabilitiesRecord, capabilityIds = []) {
  if (capabilityIds.length === 0) return true;
  let allTrue = true;
  let anyUnknown = false;

  for (const id of capabilityIds) {
    const value = getCapability(capabilitiesRecord, id);
    if (value === null) anyUnknown = true;
    else if (value === false) allTrue = false;
  }

  if (!allTrue) return false;
  return anyUnknown ? null : true;
}

export function capabilityAnySatisfied(capabilitiesRecord, capabilityIds = []) {
  if (capabilityIds.length === 0) return true;
  let anyUnknown = false;

  for (const id of capabilityIds) {
    const value = getCapability(capabilitiesRecord, id);
    if (value === true) return true;
    if (value === null) anyUnknown = true;
  }

  return anyUnknown ? null : false;
}

export function capabilityNoneSatisfied(capabilitiesRecord, capabilityIds = []) {
  if (capabilityIds.length === 0) return true;
  let anyUnknown = false;

  for (const id of capabilityIds) {
    const value = getCapability(capabilitiesRecord, id);
    if (value === true) return false;
    if (value === null) anyUnknown = true;
  }

  return anyUnknown ? null : true;
}
