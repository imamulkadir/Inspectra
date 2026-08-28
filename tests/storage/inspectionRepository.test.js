import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { DB_NAME } from "../../src/config/appConfig.js";

let database;
let repo;

// Each test gets a brand-new IndexedDB database and a fresh module graph so
// tests never see another test's leftover records.
async function resetDatabase() {
  if (database) {
    try {
      const db = await database.openDatabase();
      db.close();
    } catch {
      // nothing to close if the previous test's open failed
    }
  }

  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = resolve;
    request.onerror = resolve;
    request.onblocked = resolve;
  });

  vi.resetModules();
  database = await import("../../src/storage/database.js");
  repo = await import("../../src/storage/inspectionRepository.js");
}

beforeEach(resetDatabase);

describe("inspection records", () => {
  it("saves and loads an inspection by id", async () => {
    const inspection = { id: "insp-1", context: { device: "iphone-17-pro" }, updatedAt: "2026-01-01T00:00:00.000Z" };
    await repo.saveInspection(inspection);

    const loaded = await repo.getInspection("insp-1");
    expect(loaded).toEqual(inspection);
  });

  it("returns undefined for an inspection id that does not exist", async () => {
    const loaded = await repo.getInspection("does-not-exist");
    expect(loaded).toBeUndefined();
  });

  it("lists every saved inspection", async () => {
    await repo.saveInspection({ id: "insp-a", updatedAt: "2026-01-01T00:00:00.000Z" });
    await repo.saveInspection({ id: "insp-b", updatedAt: "2026-01-02T00:00:00.000Z" });

    const all = await repo.listInspections();
    expect(all.map((r) => r.id).sort()).toEqual(["insp-a", "insp-b"]);
  });

  it("overwrites an existing inspection with the same id on save (put semantics)", async () => {
    await repo.saveInspection({ id: "insp-1", status: "in-progress" });
    await repo.saveInspection({ id: "insp-1", status: "complete" });

    const loaded = await repo.getInspection("insp-1");
    expect(loaded.status).toBe("complete");

    const all = await repo.listInspections();
    expect(all).toHaveLength(1);
  });

  it("deletes an inspection so it can no longer be loaded", async () => {
    await repo.saveInspection({ id: "insp-1" });
    await repo.deleteInspection("insp-1");

    expect(await repo.getInspection("insp-1")).toBeUndefined();
    expect(await repo.listInspections()).toHaveLength(0);
  });

  it("does not throw when deleting an inspection id that was never saved", async () => {
    await expect(repo.deleteInspection("never-existed")).resolves.not.toThrow();
  });
});

describe("reports", () => {
  it("saves and loads a report by id", async () => {
    const report = { id: "report-1", inspectionId: "insp-1", summary: "Grade B" };
    await repo.saveReport(report);

    expect(await repo.getReport("report-1")).toEqual(report);
  });

  it("lists reports for an inspection via the inspectionId index, excluding other inspections' reports", async () => {
    await repo.saveReport({ id: "report-1", inspectionId: "insp-1" });
    await repo.saveReport({ id: "report-2", inspectionId: "insp-1" });
    await repo.saveReport({ id: "report-3", inspectionId: "insp-2" });

    const forInsp1 = await repo.listReportsForInspection("insp-1");
    expect(forInsp1.map((r) => r.id).sort()).toEqual(["report-1", "report-2"]);

    const forInsp2 = await repo.listReportsForInspection("insp-2");
    expect(forInsp2.map((r) => r.id)).toEqual(["report-3"]);
  });

  it("returns an empty array for an inspection with no reports", async () => {
    expect(await repo.listReportsForInspection("no-reports-here")).toEqual([]);
  });
});

describe("settings", () => {
  it("returns undefined for a setting key that was never set", async () => {
    expect(await repo.getSetting("theme")).toBeUndefined();
  });

  it("sets and gets a setting value by key", async () => {
    await repo.setSetting("theme", "dark");
    expect(await repo.getSetting("theme")).toBe("dark");
  });

  it("overwrites a setting value when set again with the same key", async () => {
    await repo.setSetting("theme", "dark");
    await repo.setSetting("theme", "light");
    expect(await repo.getSetting("theme")).toBe("light");
  });
});
