import { isVersionInRange } from "../utils/version.js";

function deviceRequirementSatisfied(requirement, device, devices) {
  if (!requirement) return true;
  if (!device) return null;

  if (requirement.deviceFamilies) {
    return requirement.deviceFamilies.includes(device.family);
  }

  if (requirement.introducedFamilyAtLeast) {
    const thresholdDevices = devices.filter(
      (d) => d.family === requirement.introducedFamilyAtLeast,
    );
    if (thresholdDevices.length === 0) return null;
    const thresholdYear = Math.min(...thresholdDevices.map((d) => d.introducedYear));
    if (device.introducedYear == null) return null;
    return device.introducedYear >= thresholdYear;
  }

  return true;
}

// Resolves a Settings-app route for a navigation ID given the current
// device and iOS version (section 11.3). Returns null when no configured
// route matches — the caller must show the dataset fallback text, not treat
// this as a device failure.
export function resolveNavigationRoute(navigationId, { navigationById, device, iosParsed, devices = [] }) {
  const entry = navigationById.get(navigationId);
  if (!entry) return { entry: null, route: null };

  for (const route of entry.routes ?? []) {
    const iosOk =
      route.iosMin == null && route.iosMax == null
        ? true
        : isVersionInRange(iosParsed, route.iosMin, route.iosMax);
    if (iosOk === false) continue;

    const deviceOk = deviceRequirementSatisfied(route.deviceRequirement, device, devices);
    if (deviceOk === false) continue;

    return { entry, route, iosOk, deviceOk };
  }

  return { entry, route: null };
}
