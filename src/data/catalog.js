// Thin composition layer over repository.js + indexes.js so pages don't
// each re-fetch and re-build Maps. repository.js already caches the
// underlying fetch()es; this additionally caches the built index Maps for
// the lifetime of the page session.
import {
  loadModelBrowserData,
  loadIdentificationData,
  loadInspectionData,
} from "./repository.js";
import {
  buildDeviceIndexes,
  buildFinishIndexes,
  buildVariantIndexes,
  buildCapabilityIndexes,
  buildInspectionIndexes,
  buildSourceIndexes,
  buildDiagnosticIndexes,
} from "./indexes.js";

let modelBrowserPromise = null;
let identificationPromise = null;
let inspectionPromise = null;

export function getModelBrowserCatalog() {
  if (!modelBrowserPromise) {
    modelBrowserPromise = loadModelBrowserData().then((data) => ({
      ...data,
      ...buildDeviceIndexes(data),
      ...buildFinishIndexes(data),
      ...buildSourceIndexes(data),
    }));
  }
  return modelBrowserPromise;
}

export function getIdentificationCatalog() {
  if (!identificationPromise) {
    identificationPromise = Promise.all([getModelBrowserCatalog(), loadIdentificationData()]).then(
      ([browser, identification]) => ({
        ...browser,
        ...identification,
        ...buildVariantIndexes(identification),
        ...buildCapabilityIndexes(identification),
      }),
    );
  }
  return identificationPromise;
}

export function getInspectionCatalog() {
  if (!inspectionPromise) {
    inspectionPromise = Promise.all([getIdentificationCatalog(), loadInspectionData()]).then(
      ([identification, inspection]) => ({
        ...identification,
        ...inspection,
        ...buildInspectionIndexes(inspection),
        ...buildDiagnosticIndexes(inspection),
      }),
    );
  }
  return inspectionPromise;
}
