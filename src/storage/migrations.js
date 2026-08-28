import { STORES } from "../config/appConfig.js";

// Runs inside the IndexedDB upgrade transaction. Keyed by oldVersion so a
// future schema change only adds what's missing.
export function runMigrations(db, oldVersion) {
  if (oldVersion < 1) {
    const inspections = db.createObjectStore(STORES.inspections, { keyPath: "id" });
    inspections.createIndex("updatedAt", "updatedAt");

    const evidence = db.createObjectStore(STORES.evidence, { keyPath: "id" });
    evidence.createIndex("inspectionId", "inspectionId");

    const reports = db.createObjectStore(STORES.reports, { keyPath: "id" });
    reports.createIndex("inspectionId", "inspectionId");

    db.createObjectStore(STORES.settings, { keyPath: "key" });
  }
}
