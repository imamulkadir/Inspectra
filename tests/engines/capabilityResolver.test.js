import { describe, it, expect } from "vitest";
import {
  capabilityAllSatisfied,
  capabilityAnySatisfied,
  capabilityNoneSatisfied,
} from "../../src/engines/capabilityResolver.js";

const record = { capabilities: { faceId: true, touchId: false } };

describe("capability resolvers", () => {
  it("capabilityAll returns true only when every capability is true", () => {
    expect(capabilityAllSatisfied(record, ["faceId"])).toBe(true);
    expect(capabilityAllSatisfied(record, ["faceId", "touchId"])).toBe(false);
    expect(capabilityAllSatisfied(record, [])).toBe(true);
  });

  it("capabilityAll returns null (unknown) when a key is missing rather than false", () => {
    expect(capabilityAllSatisfied(record, ["faceId", "liDAR"])).toBeNull();
  });

  it("capabilityAny returns true if at least one is true", () => {
    expect(capabilityAnySatisfied(record, ["touchId", "faceId"])).toBe(true);
  });

  it("capabilityAny returns false when all known are false and none unknown", () => {
    expect(capabilityAnySatisfied({ capabilities: { touchId: false } }, ["touchId"])).toBe(false);
  });

  it("capabilityNone returns false if any listed capability is true", () => {
    expect(capabilityNoneSatisfied(record, ["faceId"])).toBe(false);
  });

  it("capabilityNone returns true if all listed are false", () => {
    expect(capabilityNoneSatisfied(record, ["touchId"])).toBe(true);
  });

  it("a missing capability key is unknown, never coerced to false", () => {
    expect(capabilityAllSatisfied({ capabilities: {} }, ["faceId"])).toBeNull();
  });
});
