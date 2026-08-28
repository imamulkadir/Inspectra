// Copies the supplied, read-only data/iphone/ dataset into dist/ after the
// Vite build so the production bundle serves it from the same relative path
// used during development. Never edits the source folder.
import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { DATASET_VERSION_DIR } from "../src/generated/datasetPath.js";

const sourceRoot = path.resolve("data/iphone", DATASET_VERSION_DIR);
const destinationRoot = path.resolve(
  "dist/data/iphone",
  DATASET_VERSION_DIR,
);
const manifestPath = path.join(sourceRoot, "manifest.json");

async function main() {
  try {
    await access(manifestPath);
  } catch {
    throw new Error(
      `Dataset not found. Expected ${manifestPath}. Place the validated dataset inside data/iphone/ and rerun the build.`,
    );
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  await rm(destinationRoot, { recursive: true, force: true });
  await mkdir(path.dirname(destinationRoot), { recursive: true });
  await cp(sourceRoot, destinationRoot, {
    recursive: true,
    force: true,
    errorOnExist: false,
  });

  console.log(
    `Copied iPhone dataset ${manifest.version ?? "unknown"} to ${destinationRoot}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
