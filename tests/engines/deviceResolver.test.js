import { describe, it, expect } from "vitest";
import { resolveByANumber, checkModelANumberConsistency } from "../../src/engines/deviceResolver.js";
import { devices } from "../fixtures/sampleDataset.js";

const deviceById = new Map(devices.map((d) => [d.id, d]));
const variantByANumber = new Map([
  ["A2894", { id: "iphone-17-pro-a2894", deviceId: "iphone-17-pro", aNumber: "A2894" }],
]);

describe("resolveByANumber", () => {
  it("resolves a known A-number to its device and variant", () => {
    const result = resolveByANumber("a2894", { variantByANumber, deviceById });
    expect(result.resolved).toBe(true);
    expect(result.device.id).toBe("iphone-17-pro");
  });

  it("marks an unknown but well-formed A-number as unresolved, not fake/invalid", () => {
    const result = resolveByANumber("A9999", { variantByANumber, deviceById });
    expect(result.resolved).toBe(false);
    expect(result.reason).toBe("UNKNOWN_TO_DATASET");
  });

  it("rejects malformed input distinctly from an unresolved one", () => {
    const result = resolveByANumber("not-a-number", { variantByANumber, deviceById });
    expect(result.resolved).toBe(false);
    expect(result.reason).toBe("INVALID_FORMAT");
  });
});

describe("checkModelANumberConsistency", () => {
  it("reports consistent when the selected model matches the resolved A-number device", () => {
    const aNumberResolution = resolveByANumber("A2894", { variantByANumber, deviceById });
    const result = checkModelANumberConsistency(deviceById.get("iphone-17-pro"), aNumberResolution);
    expect(result.consistent).toBe(true);
  });

  it("flags a high-visibility inconsistency without silently replacing the selected model", () => {
    const aNumberResolution = resolveByANumber("A2894", { variantByANumber, deviceById });
    const selected = deviceById.get("iphone-se-2");
    const result = checkModelANumberConsistency(selected, aNumberResolution);
    expect(result.consistent).toBe(false);
    expect(result.selectedDeviceId).toBe("iphone-se-2");
    expect(result.aNumberDeviceId).toBe("iphone-17-pro");
  });

  it("returns null when there is nothing to compare yet", () => {
    expect(checkModelANumberConsistency(null, null)).toBeNull();
    expect(checkModelANumberConsistency(deviceById.get("iphone-17-pro"), { resolved: false })).toBeNull();
  });
});
