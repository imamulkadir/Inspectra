import { DATASET_VERSION_DIR } from "../generated/datasetPath.js";

const basePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const versionSegment = DATASET_VERSION_DIR ? `${DATASET_VERSION_DIR}/` : "";

// The supplied dataset ships version-namespaced (data/iphone/v1.0.0/...).
// DATASET_VERSION_DIR is detected at build/dev time by
// scripts/resolve-dataset-version.mjs from the real folder layout — the app
// never hardcodes a version string.
export const DATA_ROOT = `${basePath}data/iphone/${versionSegment}`;
