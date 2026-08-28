// Fullscreen display-pattern viewer logic (section 20.1). Patterns come
// entirely from inspections/browser-diagnostics.json — these are test
// patterns, not official iPhone finish swatches, and cannot certify
// calibration, brightness, PWM, refresh rate, or panel authenticity.
export function createDisplayPatternController(diagnosticDef) {
  const patterns = diagnosticDef?.patterns ?? [];
  let index = 0;

  function current() {
    return patterns[index] ?? null;
  }

  function next() {
    index = (index + 1) % patterns.length;
    return current();
  }

  function previous() {
    index = (index - 1 + patterns.length) % patterns.length;
    return current();
  }

  // Returns either a CSS background value or a generator name the renderer
  // must draw itself (checkerboard / small-text chart).
  function describe(pattern) {
    if (pattern.cssBackground) return { kind: "css", value: pattern.cssBackground };
    if (pattern.generator) return { kind: "generator", value: pattern.generator };
    return { kind: "css", value: "#000000" };
  }

  return { patterns, current, next, previous, describe, indexOf: () => index, count: patterns.length };
}
