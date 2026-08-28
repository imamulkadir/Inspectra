import { describe, it, expect } from "vitest";
import { containsProhibitedPhrase } from "../../src/engines/reportEngine.js";

const reportLanguage = {
  prohibitedAbsolutePhrases: [
    "Device is authentic",
    "Never repaired",
    "No water damage",
    "Safe to buy",
    "Guaranteed clean",
  ],
};

describe("containsProhibitedPhrase", () => {
  it("detects a prohibited absolute phrase case-insensitively", () => {
    expect(containsProhibitedPhrase("This device is authentic.", reportLanguage)).toBe("Device is authentic");
    expect(containsProhibitedPhrase("SAFE TO BUY!", reportLanguage)).toBe("Safe to buy");
  });

  it("returns null for cautious, non-absolute wording", () => {
    expect(containsProhibitedPhrase("No identity inconsistency was detected in the completed checks.", reportLanguage)).toBeNull();
  });

  it("returns null for empty/missing text", () => {
    expect(containsProhibitedPhrase("", reportLanguage)).toBeNull();
    expect(containsProhibitedPhrase(null, reportLanguage)).toBeNull();
  });
});
