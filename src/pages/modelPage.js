import { el, mount, clear } from "../utils/dom.js";
import { appHeader } from "../components/appHeader.js";
import { skeleton } from "../components/skeleton.js";
import { dataError } from "../components/dataError.js";
import { finishList } from "../components/finishList.js";
import { specRow, specificationSection } from "../components/specificationSection.js";
import { variantCard } from "../components/variantCard.js";
import { sourceList } from "../components/sourceLink.js";
import { formatDimensions, formatWeight, formatBoolean, titleCase } from "../utils/formatting.js";
import { router } from "../core/router.js";
import { ROUTES } from "../config/routes.js";
import { getIdentificationCatalog } from "../data/catalog.js";

export async function mountPage(root, { params }) {
  const page = el("div", { id: "main", class: "pb-10" }, [
    appHeader({ title: "Model", onBack: () => router.navigate(ROUTES.explore) }),
    el("div", { id: "model-body", class: "md:max-w-2xl md:mx-auto" }, [el("div", { class: "px-4 py-6" }, [skeleton({ lines: 8 })])]),
  ]);
  mount(root, page);

  let catalog;
  try {
    catalog = await getIdentificationCatalog();
  } catch (error) {
    mount(root.querySelector("#model-body"), dataError({ message: error.message, onRetry: () => location.reload() }));
    return () => {};
  }

  const device = catalog.deviceById.get(params.modelId);
  const body = root.querySelector("#model-body");
  clear(body);

  if (!device) {
    body.appendChild(dataError({ message: `Model "${params.modelId}" was not found in the dataset.` }));
    return () => {};
  }

  root.querySelector("h1").textContent = device.marketingName;

  const variants = catalog.variantsByDeviceId.get(device.id) ?? [];
  const capabilities = catalog.capabilitiesByDeviceId.get(device.id)?.capabilities ?? {};
  const { resolved: deviceSources } = { resolved: (device.sourceIds ?? []).map((id) => catalog.sourceById.get(id)).filter(Boolean) };

  body.appendChild(
    el("div", { class: "px-4" }, [
      specificationSection("Overview", [
        specRow("Family", device.family),
        specRow("Segment", titleCase(device.segment)),
        specRow("Introduced", device.introducedYear),
      ]),

      specificationSection("Storage", (device.storageGB ?? []).length
        ? [el("div", { class: "flex gap-2 flex-wrap py-2" }, device.storageGB.map((gb) => el("span", { class: "rounded-full border border-[var(--border)] px-3 py-1 text-sm" }, gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`)))]
        : [specRow("Storage", null)]),

      specificationSection("Finishes", [finishList(device.officialFinishNames)]),

      specificationSection("Dimensions & weight", [
        specRow("Dimensions", formatDimensions(device.dimensionsMm)),
        specRow("Weight", formatWeight(device.weightGrams)),
      ]),

      specificationSection("Construction", [
        specRow("Frame", device.construction?.frameMaterial),
        specRow("Front", device.construction?.frontMaterial),
        specRow("Back", device.construction?.backMaterial),
      ]),

      specificationSection("Display", [
        specRow("Type", device.display?.marketingName),
        specRow("Technology", device.display?.technology),
        specRow("Size", device.display?.diagonalInches ? `${device.display.diagonalInches}"` : null),
        specRow("Resolution", device.display?.resolutionPixels ? `${device.display.resolutionPixels.width} x ${device.display.resolutionPixels.height}` : null),
        specRow("ProMotion", formatBoolean(device.display?.proMotion)),
        specRow("Always-On", formatBoolean(device.display?.alwaysOn)),
        specRow("True Tone", formatBoolean(device.display?.trueTone)),
      ]),

      specificationSection("Chip", [
        specRow("Name", device.chip?.name),
        specRow("CPU cores", device.chip?.cpuCores),
        specRow("GPU cores", device.chip?.gpuCores),
      ]),

      specificationSection("Rear cameras", [
        specRow("System", device.rearCamera?.systemName),
        specRow("Physical camera count", device.rearCamera?.physicalCameraCount),
        specRow("Macro photography", formatBoolean(device.rearCamera?.macroPhotography)),
        specRow("LiDAR", formatBoolean(device.rearCamera?.liDAR)),
      ]),

      specificationSection("Front camera", [
        specRow("Name", device.frontCamera?.name),
        specRow("Megapixels", device.frontCamera?.megapixels),
        specRow("Autofocus", formatBoolean(device.frontCamera?.autofocus)),
      ]),

      specificationSection("Battery reference", [
        specRow("Video playback", device.batteryReference?.videoPlaybackHours ? `${device.batteryReference.videoPlaybackHours} h` : null),
        specRow("Streamed video", device.batteryReference?.streamedVideoPlaybackHours ? `${device.batteryReference.streamedVideoPlaybackHours} h` : null),
      ]),

      specificationSection("Biometrics", [
        specRow("Method", device.biometrics === "face_id" ? "Face ID" : device.biometrics === "touch_id" ? "Touch ID" : null),
      ]),

      specificationSection("Controls", [
        specRow("Action button", formatBoolean(device.controls?.actionButton)),
        specRow("Camera Control", formatBoolean(device.controls?.cameraControl)),
        specRow("Ring/Silent switch", formatBoolean(device.controls?.ringSilentSwitch)),
        specRow("Home button", formatBoolean(device.controls?.homeButton)),
      ]),

      specificationSection("Connector & charging", [
        specRow("Connector", device.connector?.type),
        specRow("Data standard", device.connector?.dataStandard),
        specRow("MagSafe max watts", device.charging?.magSafeMaximumWatts),
        specRow("Qi2 max watts", device.charging?.qi2MaximumWatts),
        specRow("Qi max watts", device.charging?.qiMaximumWatts),
      ]),

      specificationSection("Water resistance", [
        specRow("Rating", device.waterResistance?.rating),
        specRow("Max depth", device.waterResistance?.maximumDepthMeters ? `${device.waterResistance.maximumDepthMeters} m` : null),
      ]),

      specificationSection("Physical identification", [
        specRow("Rear physical camera count", device.physicalIdentification?.rearPhysicalCameraCount),
        specRow("Rear camera layout", device.physicalIdentification?.rearCameraLayout),
        specRow("Display cutout", titleCase(device.physicalIdentification?.displayCutout)),
        specRow("SIM tray side", device.physicalIdentification?.simTraySideWhenPresent),
      ]),

      specificationSection("Capabilities", Object.entries(capabilities).map(([key, value]) => specRow(titleCase(key), formatBoolean(value)))),

      specificationSection("Regional variants", variants.length
        ? [el("div", { class: "space-y-2 py-2" }, variants.map((v) => variantCard(v)))]
        : [specRow("Regional variants", null)]),

      specificationSection("Sources & verification", [
        specRow("Verification status", device.verification?.status),
        specRow("Verified", device.verification?.verifiedAt),
        sourceList(deviceSources),
      ]),
    ]),
  );

  return () => {};
}
