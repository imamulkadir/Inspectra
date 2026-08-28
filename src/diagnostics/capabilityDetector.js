import { DIAGNOSTIC_STATE } from "../core/constants.js";

// Detects runtime browser/API support only. Opening a diagnostic is never
// treated as completion (section 20) — that stays a separate state
// transition triggered by explicit user confirmation.
export function detectDiagnosticSupport(diagnosticId) {
  switch (diagnosticId) {
    case "display-patterns":
      return DIAGNOSTIC_STATE.AVAILABLE;

    case "touch-grid":
      return "ontouchstart" in window || navigator.maxTouchPoints > 0
        ? DIAGNOSTIC_STATE.AVAILABLE
        : DIAGNOSTIC_STATE.UNSUPPORTED;

    case "audio-channel-cues":
      return typeof window.AudioContext !== "undefined" || typeof window.webkitAudioContext !== "undefined"
        ? DIAGNOSTIC_STATE.AVAILABLE
        : DIAGNOSTIC_STATE.UNSUPPORTED;

    case "microphone-record-playback":
      return navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined"
        ? DIAGNOSTIC_STATE.AVAILABLE
        : DIAGNOSTIC_STATE.UNSUPPORTED;

    case "camera-preview":
      return navigator.mediaDevices?.getUserMedia
        ? DIAGNOSTIC_STATE.AVAILABLE
        : DIAGNOSTIC_STATE.UNSUPPORTED;

    case "motion-orientation":
      return typeof window.DeviceMotionEvent !== "undefined" ||
        typeof window.DeviceOrientationEvent !== "undefined"
        ? DIAGNOSTIC_STATE.AVAILABLE
        : DIAGNOSTIC_STATE.UNSUPPORTED;

    default:
      return DIAGNOSTIC_STATE.UNSUPPORTED;
  }
}

export function requiresExplicitMotionPermission() {
  return typeof window.DeviceMotionEvent?.requestPermission === "function";
}
