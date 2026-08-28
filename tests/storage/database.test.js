import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { STORES, DB_NAME } from "../../src/config/appConfig.js";

// database.js caches its connection in a module-level `dbPromise`, so each
// test gets a fully fresh module graph (and a fresh underlying IndexedDB
// database) to avoid one test's open connection leaking into another's.
let lastModule = null;

async function freshDatabaseModule() {
  vi.resetModules();
  const mod = await import("../../src/storage/database.js");
  lastModule = mod;
  return mod;
}

beforeEach(async () => {
  // Close whatever connection the previous test opened — IndexedDB defers
  // (blocks) deleteDatabase until every open connection is closed, and a
  // still-open connection would otherwise silently carry state into the
  // next test.
  if (lastModule) {
    try {
      const db = await lastModule.openDatabase();
      db.close();
    } catch {
      // nothing to close if the previous test's open failed/rejected
    }
    lastModule = null;
  }

  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = resolve;
    request.onerror = resolve;
    request.onblocked = resolve;
  });
});

describe("openDatabase", () => {
  it("opens the database and creates all four object stores per spec section 22.1", async () => {
    const { openDatabase } = await freshDatabaseModule();
    const db = await openDatabase();

    expect(db.name).toBe(DB_NAME);
    expect([...db.objectStoreNames].sort()).toEqual(
      [STORES.inspections, STORES.evidence, STORES.reports, STORES.settings].sort(),
    );

    db.close();
  });

  it("reuses the same connection promise across repeated calls instead of reopening", async () => {
    const { openDatabase } = await freshDatabaseModule();
    const first = await openDatabase();
    const second = await openDatabase();

    expect(second).toBe(first);

    first.close();
  });

  it("rejects when IndexedDB is not available in this browser", async () => {
    const { openDatabase } = await freshDatabaseModule();
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "indexedDB");

    // Simulate a browser without IndexedDB support (window lacks the key).
    delete window.indexedDB;

    try {
      await expect(openDatabase()).rejects.toThrow("IndexedDB is not available in this browser.");
    } finally {
      if (originalDescriptor) Object.defineProperty(window, "indexedDB", originalDescriptor);
    }
  });
});

describe("withStore", () => {
  it("resolves with the store request's result on a readwrite transaction", async () => {
    const { withStore } = await freshDatabaseModule();
    const putResult = await withStore(STORES.settings, "readwrite", (store) =>
      store.put({ key: "theme", value: "dark" }),
    );
    expect(putResult).toBe("theme");

    const getResult = await withStore(STORES.settings, "readonly", (store) => store.get("theme"));
    expect(getResult).toEqual({ key: "theme", value: "dark" });
  });

  it("rejects when the callback's operation fails inside the transaction", async () => {
    const { withStore } = await freshDatabaseModule();

    // settings store has keyPath "key" — inserting a record with a
    // duplicate key via add() (not put()) triggers a ConstraintError.
    await withStore(STORES.settings, "readwrite", (store) => store.add({ key: "dup", value: 1 }));

    await expect(
      withStore(STORES.settings, "readwrite", (store) => store.add({ key: "dup", value: 2 })),
    ).rejects.toBeInstanceOf(Error);
  });
});

describe("requestToPromise", () => {
  it("resolves an IDBRequest's result", async () => {
    const { openDatabase, requestToPromise } = await freshDatabaseModule();
    const db = await openDatabase();
    const tx = db.transaction(STORES.settings, "readwrite");
    const request = tx.objectStore(STORES.settings).put({ key: "a", value: 1 });

    await expect(requestToPromise(request)).resolves.toBe("a");
    db.close();
  });
});
