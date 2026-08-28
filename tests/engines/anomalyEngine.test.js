import { describe, it, expect } from "vitest";
import {
  anomalyFromStorageObservation,
  anomalyFromFinishObservation,
  anomalyFromModelANumberMismatch,
} from "../../src/engines/anomalyEngine.js";
import { devices } from "../fixtures/sampleDataset.js";

const proDevice = devices.find((d) => d.id === "iphone-17-pro");

describe("anomalyFromStorageObservation", () => {
  it("returns null when the observed storage matches an official option", () => {
    expect(anomalyFromStorageObservation({ device: proDevice, observedStorageGB: 256, isOther: false })).toBeNull();
  });

  it("flags a mismatch when the storage is not in the official list", () => {
    const anomaly = anomalyFromStorageObservation({ device: proDevice, observedStorageGB: 32, isOther: false });
    expect(anomaly).not.toBeNull();
    expect(anomaly.severityLabel).toBe("NEEDS_REVIEW");
  });

  it("flags a mismatch when the user selected Other", () => {
    const anomaly = anomalyFromStorageObservation({ device: proDevice, observedStorageGB: null, isOther: true });
    expect(anomaly).not.toBeNull();
    expect(anomaly.observed).toBe("Other / does not match");
  });
});

describe("anomalyFromFinishObservation", () => {
  it("returns null for an official finish name", () => {
    expect(anomalyFromFinishObservation({ device: proDevice, observedFinishName: "Silver", isOther: false })).toBeNull();
  });

  it("flags a finish not in the official list without concluding counterfeit status", () => {
    const anomaly = anomalyFromFinishObservation({ device: proDevice, observedFinishName: "Rose Gold", isOther: false });
    expect(anomaly).not.toBeNull();
    expect(anomaly.message.toLowerCase()).not.toContain("counterfeit");
    expect(anomaly.message.toLowerCase()).not.toContain("fake");
  });
});

describe("anomalyFromModelANumberMismatch", () => {
  it("returns null when consistent", () => {
    expect(anomalyFromModelANumberMismatch({ consistent: true })).toBeNull();
  });

  it("builds an anomaly carrying both device ids when inconsistent", () => {
    const anomaly = anomalyFromModelANumberMismatch({
      consistent: false,
      selectedDeviceId: "iphone-se-2",
      aNumberDeviceId: "iphone-17-pro",
      message: "mismatch",
    });
    expect(anomaly.expected).toBe("iphone-se-2");
    expect(anomaly.observed).toBe("iphone-17-pro");
  });
});
