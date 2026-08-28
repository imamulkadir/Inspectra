import { describe, it, expect } from "vitest";
import { createTouchGridController } from "../../src/diagnostics/touchTest.js";

describe("createTouchGridController", () => {
  it("defaults to a 6x4 grid (24 cells)", () => {
    const controller = createTouchGridController();
    expect(controller.rows).toBe(6);
    expect(controller.columns).toBe(4);
    expect(controller.totalCells).toBe(24);
  });

  it("honors custom rows/columns", () => {
    const controller = createTouchGridController({ rows: 3, columns: 3 });
    expect(controller.totalCells).toBe(9);
  });

  it("tracks touched cells and coverage ratio", () => {
    const controller = createTouchGridController({ rows: 2, columns: 2 });
    controller.touchCell(0);
    controller.touchCell(1);

    const snap = controller.snapshot();
    expect(snap.touchedCells).toBe(2);
    expect(snap.untouchedCells).toBe(2);
    expect(snap.coverageRatio).toBe(0.5);
    expect(snap.touchedIndexes.sort()).toEqual([0, 1]);
  });

  it("does not double-count a cell touched more than once", () => {
    const controller = createTouchGridController({ rows: 2, columns: 2 });
    controller.touchCell(0);
    controller.touchCell(0);
    controller.touchCell(0);

    expect(controller.snapshot().touchedCells).toBe(1);
  });

  it("counts an interruption when a jump between touches exceeds columns + 1", () => {
    const controller = createTouchGridController({ rows: 4, columns: 4 });
    // Adjacent touches (within a row/column) should not count as an interruption.
    controller.touchCell(0);
    controller.touchCell(1);
    expect(controller.snapshot().interruptions).toBe(0);

    // A big jump across the grid (e.g. finger lifted and placed far away)
    // should count as an interruption.
    controller.touchCell(15);
    expect(controller.snapshot().interruptions).toBe(1);
  });

  it("does not count the very first touch as an interruption", () => {
    const controller = createTouchGridController({ rows: 4, columns: 4 });
    controller.touchCell(15);
    expect(controller.snapshot().interruptions).toBe(0);
  });

  it("reset() clears touched cells, interruption count, and last-cell tracking", () => {
    const controller = createTouchGridController({ rows: 2, columns: 2 });
    controller.touchCell(0);
    controller.touchCell(3);
    controller.reset();

    const snap = controller.snapshot();
    expect(snap.touchedCells).toBe(0);
    expect(snap.interruptions).toBe(0);
    expect(snap.touchedIndexes).toEqual([]);

    // After reset, the next touch is treated as a fresh first touch (no
    // interruption computed against pre-reset state).
    controller.touchCell(3);
    expect(controller.snapshot().interruptions).toBe(0);
  });

  it("reports coverageRatio 0 for a grid with zero cells", () => {
    const controller = createTouchGridController({ rows: 0, columns: 0 });
    expect(controller.snapshot().coverageRatio).toBe(0);
  });
});
