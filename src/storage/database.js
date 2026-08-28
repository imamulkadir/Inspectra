import { DB_NAME, DB_VERSION } from "../config/appConfig.js";
import { runMigrations } from "./migrations.js";

let dbPromise = null;

export function openDatabase() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is not available in this browser."));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        runMigrations(request.result, event.oldVersion);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error("Failed to open IndexedDB."));
      };
      request.onblocked = () => {
        console.warn("[Inspectra] IndexedDB upgrade blocked by another open tab.");
      };
    });
  }
  return dbPromise;
}

export async function withStore(storeName, mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);

    tx.oncomplete = () => resolve(result instanceof IDBRequest ? result.result : result);
    // Per the IndexedDB spec, a request's "error" event bubbles to the
    // transaction (firing tx.onerror) *before* the transaction's abort
    // algorithm assigns tx.error — so tx.error can still be null here.
    // Fall back to a real Error so callers never catch a bare null.
    tx.onerror = () => reject(tx.error ?? new Error(`Transaction error on ${storeName}.`));
    tx.onabort = () => reject(tx.error ?? new Error(`Transaction aborted on ${storeName}.`));
  });
}

export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
