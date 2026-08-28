import { describe, it, expect } from "vitest";
import { createDisplayPatternController } from "../../src/diagnostics/displayTest.js";

const patterns = [
  { id: "black", cssBackground: "#000000" },
  { id: "white", cssBackground: "#ffffff" },
  { id: "checkerboard", generator: "checkerboard" },
];

describe("createDisplayPatternController", () => {
  it("starts at the first pattern", () => {
    const controller = createDisplayPatternController({ patterns });
    expect(controller.current()).toEqual(patterns[0]);
    expect(controller.indexOf()).toBe(0);
    expect(controller.count).toBe(3);
  });

  it("next() advances through patterns and wraps around to the start", () => {
    const controller = createDisplayPatternController({ patterns });
    expect(controller.next()).toEqual(patterns[1]);
    expect(controller.next()).toEqual(patterns[2]);
    expect(controller.next()).toEqual(patterns[0]);
  });

  it("previous() moves backward and wraps around to the end", () => {
    const controller = createDisplayPatternController({ patterns });
    expect(controller.previous()).toEqual(patterns[2]);
    expect(controller.previous()).toEqual(patterns[1]);
  });

  it("handles a missing/empty diagnostic definition gracefully", () => {
    const controller = createDisplayPatternController(undefined);
    expect(controller.patterns).toEqual([]);
    expect(controller.current()).toBeNull();
    expect(controller.count).toBe(0);
  });

  describe("describe()", () => {
    it("returns a css descriptor for a pattern with cssBackground", () => {
      const controller = createDisplayPatternController({ patterns });
      expect(controller.describe(patterns[0])).toEqual({ kind: "css", value: "#000000" });
    });

    it("returns a generator descriptor for a pattern with a generator field", () => {
      const controller = createDisplayPatternController({ patterns });
      expect(controller.describe(patterns[2])).toEqual({ kind: "generator", value: "checkerboard" });
    });

    it("falls back to a black css background for a pattern with neither field", () => {
      const controller = createDisplayPatternController({ patterns });
      expect(controller.describe({ id: "blank" })).toEqual({ kind: "css", value: "#000000" });
    });
  });
});
