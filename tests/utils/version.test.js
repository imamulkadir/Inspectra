import { describe, it, expect } from "vitest";
import { parseVersion, compareVersions, isVersionInRange } from "../../src/utils/version.js";

describe("parseVersion", () => {
  it("parses major.minor.patch numerically", () => {
    expect(parseVersion("18.4.1")).toMatchObject({ major: 18, minor: 4, patch: 1, channel: "stable" });
  });

  it("defaults missing minor/patch to 0", () => {
    expect(parseVersion("26")).toMatchObject({ major: 26, minor: 0, patch: 0 });
  });

  it("detects beta/RC channels", () => {
    expect(parseVersion("26.1 Developer Beta").channel).toBe("developer_beta");
    expect(parseVersion("18.5 Public Beta").channel).toBe("public_beta");
    expect(parseVersion("17.0 RC").channel).toBe("rc");
  });

  it("returns null for unparseable input", () => {
    expect(parseVersion("not a version")).toBeNull();
    expect(parseVersion(null)).toBeNull();
  });

  it("rejects garbage trailing a valid-looking numeric prefix instead of silently dropping it", () => {
    expect(parseVersion("26.ioasudoaisu")).toBeNull();
    expect(parseVersion("26.4abc")).toBeNull();
    expect(parseVersion("26.4.1.9")).toBeNull();
  });

  it("rejects a version segment with more than 2 digits (not a real iOS release number)", () => {
    expect(parseVersion("26.89237492837")).toBeNull();
    expect(parseVersion("263.4")).toBeNull();
  });
});

describe("compareVersions", () => {
  it("compares numerically, not lexicographically (9 < 10)", () => {
    expect(compareVersions("9.0", "10.0")).toBe(-1);
  });

  it("returns 0 for equal versions", () => {
    expect(compareVersions("18.4.0", "18.4")).toBe(0);
  });

  it("returns 1 when left is greater", () => {
    expect(compareVersions("18.4.2", "18.4.1")).toBe(1);
  });

  it("returns null when either side is unparseable", () => {
    expect(compareVersions("nope", "18.0")).toBeNull();
  });
});

describe("isVersionInRange", () => {
  it("returns true when within an inclusive min/max range", () => {
    expect(isVersionInRange("17.4", "17.0", "18.0")).toBe(true);
  });

  it("returns false when below min", () => {
    expect(isVersionInRange("16.9", "17.0", null)).toBe(false);
  });

  it("returns false when above max", () => {
    expect(isVersionInRange("18.1", null, "18.0")).toBe(false);
  });

  it("returns null when version is unparseable", () => {
    expect(isVersionInRange("nope", "17.0", null)).toBeNull();
  });
});
