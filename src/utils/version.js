// iOS version parsing/comparison. Versions are ALWAYS compared numerically,
// never as strings ("9.0" < "10.0" would be wrong as a string compare).
//
// Anchored at both ends (and each segment capped at 2 digits) so a garbage
// suffix after a valid-looking prefix is rejected rather than silently
// dropped — "26.ioasudoaisu" and "26.89237492837" must not parse as a clean
// "26.0.0"/"26.89237492837.0" the way an unanchored match would let through.
const VERSION_PATTERN = /^(\d{1,2})(?:\.(\d{1,2}))?(?:\.(\d{1,2}))?$/;
const CHANNEL_PATTERN =
  /\b(public beta|developer beta|beta|rc|release candidate)\b/i;

export function parseVersion(value) {
  const raw = String(value ?? "").trim();

  const channelMatch = raw.match(CHANNEL_PATTERN);
  let channel = "stable";
  let numericPart = raw;
  if (channelMatch) {
    const label = channelMatch[1].toLowerCase();
    if (label.includes("developer")) channel = "developer_beta";
    else if (label.includes("public")) channel = "public_beta";
    else if (label.includes("beta")) channel = "public_beta";
    else channel = "rc";
    numericPart = raw.slice(0, channelMatch.index).trim();
  }

  const match = numericPart.match(VERSION_PATTERN);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
    channel,
    raw,
  };
}

export function compareVersions(left, right) {
  const a = typeof left === "string" ? parseVersion(left) : left;
  const b = typeof right === "string" ? parseVersion(right) : right;
  if (!a || !b) return null;

  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  return 0;
}

export function isVersionInRange(version, min, max) {
  const parsed = typeof version === "string" ? parseVersion(version) : version;
  if (!parsed) return null;

  if (min != null) {
    const cmpMin = compareVersions(parsed, min);
    if (cmpMin === null) return null;
    if (cmpMin < 0) return false;
  }

  if (max != null) {
    const cmpMax = compareVersions(parsed, max);
    if (cmpMax === null) return null;
    if (cmpMax > 0) return false;
  }

  return true;
}
