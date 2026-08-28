import { parseVersion, compareVersions } from "../utils/version.js";

// Compares an entered iOS version against ios/releases.json's latest
// verified exact release and reports whether it exceeds verified data or
// runs a beta/RC channel (section 11.2). Never reduces a confidence score —
// this is a limitation to list, not a penalty to compute.
export function resolveIosContext(iosVersionInput, { releases, compatibility, deviceId }) {
  const parsed = parseVersion(iosVersionInput);
  if (!parsed) {
    return { parsed: null, valid: false };
  }

  const releaseForMajor = releases?.releases?.find((r) => r.major === parsed.major) ?? null;
  const latestVerified = releaseForMajor?.latestMinorInDataset ?? null;

  const newerThanVerified =
    latestVerified != null ? compareVersions(parsed, latestVerified) === 1 : parsed.channel !== "stable";

  const isBetaChannel = parsed.channel !== "stable";

  // A major iOS version is plausible if the dataset already represents it,
  // or if it's exactly one above the highest represented major (the next
  // major's beta cycle, ahead of this dataset being updated for it). Any
  // other major (a gap version Apple never shipped, or an arbitrary made-up
  // number) is rejected — this is what stops "any random number typed in"
  // from being accepted as a real iOS version.
  const knownMajor = releaseForMajor != null;
  const representedMajors = releases?.majorVersionsRepresented ?? [];
  const maxKnownMajor = representedMajors.length ? Math.max(...representedMajors) : null;
  const plausible = knownMajor || (maxKnownMajor != null && parsed.major === maxKnownMajor + 1);

  const compatibleWithCurrentMajor =
    compatibility?.iosMajor === parsed.major
      ? compatibility.compatibleDeviceIds?.includes(deviceId) ?? null
      : null;

  return {
    parsed,
    valid: true,
    plausible,
    releaseForMajor,
    latestVerified,
    newerThanVerified,
    isBetaChannel,
    compatibleWithCurrentMajor,
    limitations: [
      newerThanVerified
        ? "This iOS version is newer than the currently verified exact release data. Some navigation instructions may differ."
        : null,
      isBetaChannel
        ? "The device is running a beta/developer/RC iOS channel. Behavior and Settings paths may differ from the stable release."
        : null,
    ].filter(Boolean),
  };
}
