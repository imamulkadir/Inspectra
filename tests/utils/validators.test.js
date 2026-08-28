import { describe, it, expect } from "vitest";
import { normalizeANumber, isValidANumberFormat } from "../../src/utils/validators.js";

describe("normalizeANumber", () => {
  it("trims, uppercases, and removes internal whitespace", () => {
    expect(normalizeANumber("  a 2894 ")).toBe("A2894");
    expect(normalizeANumber("a2894")).toBe("A2894");
  });
});

describe("isValidANumberFormat", () => {
  it("accepts the basic A#### format", () => {
    expect(isValidANumberFormat("A2894")).toBe(true);
    expect(isValidANumberFormat("a2894")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidANumberFormat("A28")).toBe(false);
    expect(isValidANumberFormat("B2894")).toBe(false);
    expect(isValidANumberFormat("A28945")).toBe(false);
    expect(isValidANumberFormat("")).toBe(false);
  });
});
