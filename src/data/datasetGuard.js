import { loadManifest, loadValidationReport, loadDeviceIndex } from "./repository.js";
import { DatasetError } from "../core/errorBoundary.js";

// Dataset health gate (section 7.3). Never falls back to mock data — a
// missing/invalid dataset must produce a clear blocking error.
export async function checkDatasetHealth() {
  const manifest = await loadManifest();

  if (!manifest || typeof manifest !== "object") {
    throw new DatasetError("manifest.json did not return a valid object.");
  }

  if (manifest.validationStatus !== "PASS") {
    throw new DatasetError(
      `Dataset validation status is "${manifest.validationStatus ?? "unknown"}", expected "PASS".`,
    );
  }

  const [validation, deviceIndex] = await Promise.all([
    loadValidationReport(),
    loadDeviceIndex(),
  ]);

  if (validation?.status !== "PASS") {
    throw new DatasetError(
      `Dataset validation report status is "${validation?.status ?? "unknown"}".`,
    );
  }

  if (!Array.isArray(deviceIndex?.devices) || deviceIndex.devices.length === 0) {
    throw new DatasetError("devices/device-index.json did not return a device list.");
  }

  return { manifest, validation };
}
