// Motion/orientation observation (section 20.6) — a raw browser-event
// display, never called sensor calibration. iOS requires an explicit
// permission prompt triggered by a user gesture on supporting versions.
export async function requestMotionPermission() {
  if (typeof window.DeviceMotionEvent?.requestPermission === "function") {
    return window.DeviceMotionEvent.requestPermission();
  }
  return "granted";
}

export function createMotionController({ onMotion, onOrientation } = {}) {
  function handleMotion(event) {
    onMotion?.({
      acceleration: readVector(event.acceleration),
      accelerationIncludingGravity: readVector(event.accelerationIncludingGravity),
      rotationRate: event.rotationRate
        ? { alpha: event.rotationRate.alpha, beta: event.rotationRate.beta, gamma: event.rotationRate.gamma }
        : null,
    });
  }

  function handleOrientation(event) {
    onOrientation?.({ alpha: event.alpha, beta: event.beta, gamma: event.gamma });
  }

  function start() {
    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);
  }

  function stop() {
    window.removeEventListener("devicemotion", handleMotion);
    window.removeEventListener("deviceorientation", handleOrientation);
  }

  return { start, stop };
}

function readVector(vector) {
  if (!vector) return null;
  return { x: vector.x, y: vector.y, z: vector.z };
}
