import { normalizeANumber, isValidANumberFormat } from "../utils/validators.js";

// Method A — A-number first (section 10.1).
export function resolveByANumber(aNumberInput, { variantByANumber, deviceById }) {
  const normalized = normalizeANumber(aNumberInput);

  if (!isValidANumberFormat(normalized)) {
    return { resolved: false, normalized, reason: "INVALID_FORMAT" };
  }

  const variant = variantByANumber.get(normalized);
  if (!variant) {
    return { resolved: false, normalized, reason: "UNKNOWN_TO_DATASET" };
  }

  const device = deviceById.get(variant.deviceId);
  if (!device) {
    return { resolved: false, normalized, reason: "VARIANT_DEVICE_MISSING" };
  }

  return { resolved: true, normalized, variant, device };
}

// Method B — model first, optional A-number confirmation afterward. Never
// silently replaces the user's selected model; a mismatch becomes a
// high-visibility identity inconsistency instead (section 10.1).
export function checkModelANumberConsistency(selectedDevice, aNumberResolution) {
  if (!selectedDevice || !aNumberResolution?.resolved) return null;

  if (aNumberResolution.device.id === selectedDevice.id) {
    return { consistent: true };
  }

  return {
    consistent: false,
    selectedDeviceId: selectedDevice.id,
    aNumberDeviceId: aNumberResolution.device.id,
    message:
      "The entered A-number resolves to a different model than the one selected. Recheck the model number and the A-number before continuing.",
  };
}
