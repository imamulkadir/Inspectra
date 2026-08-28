import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { runMigrations } from "../../src/storage/migrations.js";
import { STORES } from "../../src/config/appConfig.js";

// Each test opens a uniquely named database so migration behavior is
// verified in isolation, without depending on test execution order.
function openRaw(name, version, onUpgrade) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = (event) => onUpgrade(request.result, event.oldVersion);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function uniqueName() {
  return `inspectra-migrations-test-${Math.random().toString(36).slice(2)}`;
}

describe("runMigrations", () => {
  it("creates all four object stores from a fresh database (oldVersion 0)", async () => {
    const db = await openRaw(uniqueName(), 1, (rawDb, oldVersion) => runMigrations(rawDb, oldVersion));

    expect([...db.objectStoreNames].sort()).toEqual(
      [STORES.inspections, STORES.evidence, STORES.reports, STORES.settings].sort(),
    );

    db.close();
  });

  it("gives the inspections store keyPath 'id' and an 'updatedAt' index", async () => {
    const db = await openRaw(uniqueName(), 1, (rawDb, oldVersion) => runMigrations(rawDb, oldVersion));
    const tx = db.transaction(STORES.inspections, "readonly");
    const store = tx.objectStore(STORES.inspections);

    expect(store.keyPath).toBe("id");
    expect([...store.indexNames]).toContain("updatedAt");
    expect(store.index("updatedAt").keyPath).toBe("updatedAt");

    db.close();
  });

  it("gives the evidence store keyPath 'id' and an 'inspectionId' index", async () => {
    const db = await openRaw(uniqueName(), 1, (rawDb, oldVersion) => runMigrations(rawDb, oldVersion));
    const tx = db.transaction(STORES.evidence, "readonly");
    const store = tx.objectStore(STORES.evidence);

    expect(store.keyPath).toBe("id");
    expect([...store.indexNames]).toContain("inspectionId");
    expect(store.index("inspectionId").keyPath).toBe("inspectionId");

    db.close();
  });

  it("gives the reports store keyPath 'id' and an 'inspectionId' index", async () => {
    const db = await openRaw(uniqueName(), 1, (rawDb, oldVersion) => runMigrations(rawDb, oldVersion));
    const tx = db.transaction(STORES.reports, "readonly");
    const store = tx.objectStore(STORES.reports);

    expect(store.keyPath).toBe("id");
    expect([...store.indexNames]).toContain("inspectionId");
    expect(store.index("inspectionId").keyPath).toBe("inspectionId");

    db.close();
  });

  it("gives the settings store keyPath 'key' and no secondary indexes", async () => {
    const db = await openRaw(uniqueName(), 1, (rawDb, oldVersion) => runMigrations(rawDb, oldVersion));
    const tx = db.transaction(STORES.settings, "readonly");
    const store = tx.objectStore(STORES.settings);

    expect(store.keyPath).toBe("key");
    expect([...store.indexNames]).toEqual([]);

    db.close();
  });

  it("does nothing (does not throw or duplicate stores) when oldVersion is already at or above 1", async () => {
    const name = uniqueName();
    // First open creates the schema.
    const first = await openRaw(name, 1, (rawDb, oldVersion) => runMigrations(rawDb, oldVersion));
    first.close();

    // Re-open at the same version: onupgradeneeded is not fired by IndexedDB
    // at all in this case, so runMigrations is never invoked again — but we
    // simulate calling it directly with oldVersion=1 to confirm the guard
    // (`oldVersion < 1`) prevents re-creating stores that already exist.
    const second = await openRaw(name, 1, () => {});
    expect(() => runMigrations(second, 1)).not.toThrow();
    expect([...second.objectStoreNames].sort()).toEqual(
      [STORES.inspections, STORES.evidence, STORES.reports, STORES.settings].sort(),
    );

    second.close();
  });
});
