import { withStore } from "./database.js";
import { STORES } from "../config/appConfig.js";

export async function saveInspection(inspection) {
  return withStore(STORES.inspections, "readwrite", (store) => store.put(inspection));
}

export async function getInspection(id) {
  return withStore(STORES.inspections, "readonly", (store) => store.get(id));
}

export async function listInspections() {
  return withStore(STORES.inspections, "readonly", (store) => store.getAll());
}

export async function deleteInspection(id) {
  return withStore(STORES.inspections, "readwrite", (store) => store.delete(id));
}

export async function saveReport(report) {
  return withStore(STORES.reports, "readwrite", (store) => store.put(report));
}

export async function getReport(id) {
  return withStore(STORES.reports, "readonly", (store) => store.get(id));
}

export async function listReportsForInspection(inspectionId) {
  return withStore(STORES.reports, "readonly", (store) =>
    store.index("inspectionId").getAll(inspectionId),
  );
}

export async function getSetting(key) {
  const record = await withStore(STORES.settings, "readonly", (store) => store.get(key));
  return record?.value;
}

export async function setSetting(key, value) {
  return withStore(STORES.settings, "readwrite", (store) => store.put({ key, value }));
}
