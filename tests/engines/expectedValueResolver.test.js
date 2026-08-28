import { describe, it, expect } from "vitest";
import { resolveExpectedValue, compareValues } from "../../src/engines/expectedValueResolver.js";
import { COMPARISON_OUTCOME } from "../../src/core/constants.js";
import { devices } from "../fixtures/sampleDataset.js";

const context = { device: devices[0], variant: { aNumber: "A2894" } };

describe("resolveExpectedValue", () => {
  it("resolves a deviceField path", () => {
    const result = resolveExpectedValue({ deviceField: "marketingName" }, context);
    expect(result.resolved).toBe(true);
    expect(result.value).toBe("iPhone 17 Pro");
  });

  it("resolves a variantField path", () => {
    const result = resolveExpectedValue({ variantField: "aNumber" }, context);
    expect(result.value).toBe("A2894");
  });

  it("resolves a resolver path prefixed with device.", () => {
    const result = resolveExpectedValue({ resolver: "device.connector.type" }, context);
    expect(result.value).toBe("USB-C");
  });

  it("returns unresolved for null expected", () => {
    expect(resolveExpectedValue(null, context).resolved).toBe(false);
  });
});

describe("compareValues", () => {
  it("matches case/whitespace-insensitively", () => {
    const expected = { resolved: true, value: "iPhone 17 Pro" };
    expect(compareValues("  iphone 17 pro ", expected)).toBe(COMPARISON_OUTCOME.MATCH);
  });

  it("returns MISMATCH for a different value, never a loose substring match", () => {
    const expected = { resolved: true, value: "iPhone 17 Pro" };
    expect(compareValues("iPhone 17", expected)).toBe(COMPARISON_OUTCOME.MISMATCH);
  });

  it("returns NOT_COMPARABLE when nothing was observed", () => {
    const expected = { resolved: true, value: "iPhone 17 Pro" };
    expect(compareValues("", expected)).toBe(COMPARISON_OUTCOME.NOT_COMPARABLE);
    expect(compareValues(undefined, expected)).toBe(COMPARISON_OUTCOME.NOT_COMPARABLE);
  });

  it("returns UNRESOLVED when the expected value itself could not be resolved", () => {
    expect(compareValues("anything", { resolved: false })).toBe(COMPARISON_OUTCOME.UNRESOLVED);
  });
});
