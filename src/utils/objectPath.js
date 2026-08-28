// Safe dotted-path object access without eval(). Used to resolve
// expected-value field paths such as "display.dynamicIsland" or
// "physicalIdentification.rearCameraLayout" against a device/variant record.
export function getByPath(source, path) {
  if (source == null || typeof path !== "string" || path === "") {
    return undefined;
  }

  const segments = path.split(".");
  let current = source;

  for (const segment of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[segment];
  }

  return current;
}
