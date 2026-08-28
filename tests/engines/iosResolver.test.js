import { describe, it, expect } from "vitest";
import { resolveIosContext } from "../../src/engines/iosResolver.js";

const releases = {
  releases: [{ major: 18, status: "historical", latestMinorInDataset: "18.5" }],
};
const compatibility = { iosMajor: 26, compatibleDeviceIds: ["iphone-17-pro"] };

describe("resolveIosContext", () => {
  it("flags a version newer than the verified latest as a limitation, not a penalty", () => {
    const result = resolveIosContext("18.6", { releases, compatibility, deviceId: "iphone-17-pro" });
    expect(result.newerThanVerified).toBe(true);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("does not flag a version at or below the verified latest", () => {
    const result = resolveIosContext("18.4", { releases, compatibility, deviceId: "iphone-17-pro" });
    expect(result.newerThanVerified).toBe(false);
  });

  it("flags a beta channel as a limitation", () => {
    const result = resolveIosContext("26.1 Developer Beta", { releases, compatibility, deviceId: "iphone-17-pro" });
    expect(result.isBetaChannel).toBe(true);
    expect(result.limitations.some((l) => l.toLowerCase().includes("beta"))).toBe(true);
  });

  it("returns valid:false for unparseable input", () => {
    expect(resolveIosContext("nonsense", { releases, compatibility, deviceId: "x" }).valid).toBe(false);
  });
});
