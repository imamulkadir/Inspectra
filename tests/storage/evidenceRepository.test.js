import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
  repo = await import("../../src/storage/evidenceRepository.js");
}

beforeEach(resetDatabase);

describe("addEvidence", () => {
  it("saves a photo evidence record tied to an inspection, generating an id and createdAt", async () => {
    const blob = new Blob(["fake-png-bytes"], { type: "image/png" });
    const record = await repo.addEvidence({ inspectionId: "insp-1", ruleId: "screen.pixel-check", kind: "photo", blob });

    expect(record.id).toMatch(/^evidence_/);
    expect(record.inspectionId).toBe("insp-1");
    expect(record.ruleId).toBe("screen.pixel-check");
    expect(record.kind).toBe("photo");
    expect(record.blob).toBe(blob);
    expect(record.note).toBeNull();
    expect(typeof record.createdAt).toBe("string");
    expect(Number.isNaN(Date.parse(record.createdAt))).toBe(false);

    const loaded = await repo.listEvidenceForInspection("insp-1");
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(record.id);
  });

  it("saves a note-only evidence record with no blob", async () => {
    const record = await repo.addEvidence({ inspectionId: "insp-1", ruleId: "battery.health", kind: "note", note: "Battery health reads 87%." });

    expect(record.blob).toBeNull();
    expect(record.note).toBe("Battery health reads 87%.");
  });

  it("rejects a blob larger than the 15MB evidence size limit", async () => {
    const oversized = { size: 15 * 1024 * 1024 + 1, type: "image/png" };
    await expect(
      repo.addEvidence({ inspectionId: "insp-1", ruleId: "r", kind: "photo", blob: oversized }),
    ).rejects.toThrow("Evidence file is too large to store locally.");
  });

  it("accepts a blob exactly at the 15MB size limit", async () => {
    const atLimit = { size: 15 * 1024 * 1024, type: "image/png" };
    await expect(
      repo.addEvidence({ inspectionId: "insp-1", ruleId: "r", kind: "photo", blob: atLimit }),
    ).resolves.toMatchObject({ inspectionId: "insp-1" });
  });

  it("rejects an unsupported evidence mime type", async () => {
    const blob = new Blob(["x"], { type: "application/pdf" });
    await expect(
      repo.addEvidence({ inspectionId: "insp-1", ruleId: "r", kind: "photo", blob }),
    ).rejects.toThrow("Unsupported evidence type: application/pdf");
  });

  it.each(["image/png", "image/jpeg", "image/webp", "audio/webm", "audio/wav"])(
    "accepts the allowed evidence type %s",
    async (type) => {
      const blob = new Blob(["x"], { type });
      await expect(
        repo.addEvidence({ inspectionId: "insp-1", ruleId: "r", kind: "photo", blob }),
      ).resolves.toBeTruthy();
    },
  );
});

describe("listEvidenceForInspection", () => {
  it("returns only evidence for the requested inspection via the inspectionId index", async () => {
    await repo.addEvidence({ inspectionId: "insp-1", ruleId: "r1", kind: "note", note: "a" });
    await repo.addEvidence({ inspectionId: "insp-1", ruleId: "r2", kind: "note", note: "b" });
    await repo.addEvidence({ inspectionId: "insp-2", ruleId: "r3", kind: "note", note: "c" });

    const forInsp1 = await repo.listEvidenceForInspection("insp-1");
    expect(forInsp1).toHaveLength(2);
    expect(forInsp1.every((e) => e.inspectionId === "insp-1")).toBe(true);

    const forInsp2 = await repo.listEvidenceForInspection("insp-2");
    expect(forInsp2).toHaveLength(1);
  });

  it("returns an empty array for an inspection with no evidence", async () => {
    expect(await repo.listEvidenceForInspection("no-evidence-here")).toEqual([]);
  });
});

describe("deleteEvidence", () => {
  it("removes a single evidence record by id", async () => {
    const record = await repo.addEvidence({ inspectionId: "insp-1", ruleId: "r1", kind: "note", note: "a" });
    await repo.deleteEvidence(record.id);

    expect(await repo.listEvidenceForInspection("insp-1")).toEqual([]);
  });
});

describe("deleteAllEvidenceForInspection", () => {
  it("removes every evidence record for an inspection and leaves other inspections untouched", async () => {
    await repo.addEvidence({ inspectionId: "insp-1", ruleId: "r1", kind: "note", note: "a" });
    await repo.addEvidence({ inspectionId: "insp-1", ruleId: "r2", kind: "note", note: "b" });
    await repo.addEvidence({ inspectionId: "insp-2", ruleId: "r3", kind: "note", note: "c" });

    const deletedCount = await repo.deleteAllEvidenceForInspection("insp-1");
    expect(deletedCount).toBe(2);

    expect(await repo.listEvidenceForInspection("insp-1")).toEqual([]);
    expect(await repo.listEvidenceForInspection("insp-2")).toHaveLength(1);
  });

  it("returns 0 and does not throw for an inspection with no evidence", async () => {
    await expect(repo.deleteAllEvidenceForInspection("no-evidence-here")).resolves.toBe(0);
  });
});

describe("estimateStorageUsage", () => {
  const originalStorage = navigator.storage;

  afterEach(() => {
    Object.defineProperty(navigator, "storage", { value: originalStorage, configurable: true });
  });

  it("returns usage and quota when navigator.storage.estimate is available", async () => {
    Object.defineProperty(navigator, "storage", {
      value: { estimate: async () => ({ usage: 1024, quota: 1024 * 1024 }) },
      configurable: true,
    });

    expect(await repo.estimateStorageUsage()).toEqual({ usage: 1024, quota: 1024 * 1024 });
  });

  it("returns nulls when the Storage API is unavailable", async () => {
    Object.defineProperty(navigator, "storage", { value: undefined, configurable: true });

    expect(await repo.estimateStorageUsage()).toEqual({ usage: null, quota: null });
  });
});
