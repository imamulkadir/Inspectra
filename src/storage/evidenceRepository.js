import { withStore } from "./database.js";
import { STORES } from "../config/appConfig.js";
import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/dates.js";

const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "audio/webm", "audio/wav"]);

export async function addEvidence({ inspectionId, ruleId, kind, blob, note }) {
  if (blob) {
    if (blob.size > MAX_EVIDENCE_BYTES) {
      throw new Error("Evidence file is too large to store locally.");
    }
    if (blob.type && !ALLOWED_TYPES.has(blob.type)) {
      throw new Error(`Unsupported evidence type: ${blob.type}`);
    }
  }

  const record = {
    id: createId("evidence"),
    inspectionId,
    ruleId,
    kind,
    blob: blob ?? null,
    note: note ?? null,
    createdAt: nowIso(),
  };

  await withStore(STORES.evidence, "readwrite", (store) => store.put(record));
  return record;
}

export async function listEvidenceForInspection(inspectionId) {
  return withStore(STORES.evidence, "readonly", (store) =>
    store.index("inspectionId").getAll(inspectionId),
  );
}

export async function deleteEvidence(id) {
  return withStore(STORES.evidence, "readwrite", (store) => store.delete(id));
}

export async function deleteAllEvidenceForInspection(inspectionId) {
  const records = await listEvidenceForInspection(inspectionId);
  return withStore(STORES.evidence, "readwrite", (store) => {
    for (const record of records) store.delete(record.id);
    return records.length;
  });
}

export async function estimateStorageUsage() {
  if (!navigator.storage?.estimate) return { usage: null, quota: null };
  const { usage, quota } = await navigator.storage.estimate();
  return { usage, quota };
}
