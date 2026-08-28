import { describe, it, expect, afterEach } from "vitest";
import { detectDiagnosticSupport, requiresExplicitMotionPermission } from "../../src/diagnostics/capabilityDetector.js";
import { DIAGNOSTIC_STATE } from "../../src/core/constants.js";

function restoreAll(snapshot) {
  for (const [key, value] of snapshot) {
    if (value === undefined) delete window[key];
    else window[key] = value;
  }
}

describe("detectDiagnosticSupport", () => {
  it("always reports display-patterns as available (no browser API is required)", () => {
    expect(detectDiagnosticSupport("display-patterns")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
  });

  it("returns UNSUPPORTED for an unknown diagnostic id", () => {
    expect(detectDiagnosticSupport("not-a-real-diagnostic")).toBe(DIAGNOSTIC_STATE.UNSUPPORTED);
  });

  describe("touch-grid", () => {
    const snapshot = new Map();

    afterEach(() => restoreAll(snapshot));

    it("is AVAILABLE when ontouchstart exists on window", () => {
      snapshot.set("ontouchstart", window.ontouchstart);
      window.ontouchstart = () => {};
      expect(detectDiagnosticSupport("touch-grid")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
    });

    it("is AVAILABLE when navigator.maxTouchPoints is greater than 0", () => {
      const original = Object.getOwnPropertyDescriptor(navigator, "maxTouchPoints");
      Object.defineProperty(navigator, "maxTouchPoints", { value: 5, configurable: true });
      try {
        expect(detectDiagnosticSupport("touch-grid")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
      } finally {
        if (original) Object.defineProperty(navigator, "maxTouchPoints", original);
      }
    });

    it("is UNSUPPORTED when neither touch signal is present", () => {
      delete window.ontouchstart;
      const original = Object.getOwnPropertyDescriptor(navigator, "maxTouchPoints");
      Object.defineProperty(navigator, "maxTouchPoints", { value: 0, configurable: true });
      try {
        expect(detectDiagnosticSupport("touch-grid")).toBe(DIAGNOSTIC_STATE.UNSUPPORTED);
      } finally {
        if (original) Object.defineProperty(navigator, "maxTouchPoints", original);
      }
    });
  });

  describe("audio-channel-cues", () => {
    const snapshot = new Map();

    afterEach(() => restoreAll(snapshot));

    it("is AVAILABLE when window.AudioContext exists", () => {
      snapshot.set("AudioContext", window.AudioContext);
      window.AudioContext = function AudioContext() {};
      expect(detectDiagnosticSupport("audio-channel-cues")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
    });

    it("is AVAILABLE when only webkitAudioContext exists", () => {
      snapshot.set("AudioContext", window.AudioContext);
      snapshot.set("webkitAudioContext", window.webkitAudioContext);
      delete window.AudioContext;
      window.webkitAudioContext = function webkitAudioContext() {};
      expect(detectDiagnosticSupport("audio-channel-cues")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
    });

    it("is UNSUPPORTED when neither AudioContext constructor exists", () => {
      snapshot.set("AudioContext", window.AudioContext);
      snapshot.set("webkitAudioContext", window.webkitAudioContext);
      delete window.AudioContext;
      delete window.webkitAudioContext;
      expect(detectDiagnosticSupport("audio-channel-cues")).toBe(DIAGNOSTIC_STATE.UNSUPPORTED);
    });
  });

  describe("microphone-record-playback", () => {
    const snapshot = new Map();

    afterEach(() => restoreAll(snapshot));

    it("is AVAILABLE when getUserMedia and MediaRecorder both exist", () => {
      snapshot.set("MediaRecorder", window.MediaRecorder);
      Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: () => {} }, configurable: true });
      window.MediaRecorder = function MediaRecorder() {};
      expect(detectDiagnosticSupport("microphone-record-playback")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
    });

    it("is UNSUPPORTED when mediaDevices is missing", () => {
      snapshot.set("MediaRecorder", window.MediaRecorder);
      Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
      window.MediaRecorder = function MediaRecorder() {};
      expect(detectDiagnosticSupport("microphone-record-playback")).toBe(DIAGNOSTIC_STATE.UNSUPPORTED);
    });

    it("is UNSUPPORTED when MediaRecorder is missing even if getUserMedia exists", () => {
      snapshot.set("MediaRecorder", window.MediaRecorder);
      Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: () => {} }, configurable: true });
      delete window.MediaRecorder;
      expect(detectDiagnosticSupport("microphone-record-playback")).toBe(DIAGNOSTIC_STATE.UNSUPPORTED);
    });
  });

  describe("camera-preview", () => {
    it("is AVAILABLE when navigator.mediaDevices.getUserMedia exists", () => {
      Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: () => {} }, configurable: true });
      expect(detectDiagnosticSupport("camera-preview")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
    });

    it("is UNSUPPORTED when navigator.mediaDevices is absent", () => {
      Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
      expect(detectDiagnosticSupport("camera-preview")).toBe(DIAGNOSTIC_STATE.UNSUPPORTED);
    });
  });

  describe("motion-orientation", () => {
    const snapshot = new Map();

    afterEach(() => restoreAll(snapshot));

    it("is AVAILABLE when DeviceMotionEvent exists", () => {
      snapshot.set("DeviceMotionEvent", window.DeviceMotionEvent);
      window.DeviceMotionEvent = function DeviceMotionEvent() {};
      expect(detectDiagnosticSupport("motion-orientation")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
    });

    it("is AVAILABLE when only DeviceOrientationEvent exists", () => {
      snapshot.set("DeviceMotionEvent", window.DeviceMotionEvent);
      snapshot.set("DeviceOrientationEvent", window.DeviceOrientationEvent);
      delete window.DeviceMotionEvent;
      window.DeviceOrientationEvent = function DeviceOrientationEvent() {};
      expect(detectDiagnosticSupport("motion-orientation")).toBe(DIAGNOSTIC_STATE.AVAILABLE);
    });

    it("is UNSUPPORTED when neither motion event constructor exists", () => {
      snapshot.set("DeviceMotionEvent", window.DeviceMotionEvent);
      snapshot.set("DeviceOrientationEvent", window.DeviceOrientationEvent);
      delete window.DeviceMotionEvent;
      delete window.DeviceOrientationEvent;
      expect(detectDiagnosticSupport("motion-orientation")).toBe(DIAGNOSTIC_STATE.UNSUPPORTED);
    });
  });
});

describe("requiresExplicitMotionPermission", () => {
  const snapshot = new Map();

  afterEach(() => restoreAll(snapshot));

  it("is true when DeviceMotionEvent.requestPermission is a function (iOS 13+ Safari)", () => {
    snapshot.set("DeviceMotionEvent", window.DeviceMotionEvent);
    window.DeviceMotionEvent = function DeviceMotionEvent() {};
    window.DeviceMotionEvent.requestPermission = async () => "granted";
    expect(requiresExplicitMotionPermission()).toBe(true);
  });

  it("is false when DeviceMotionEvent has no requestPermission (most other browsers)", () => {
    snapshot.set("DeviceMotionEvent", window.DeviceMotionEvent);
    window.DeviceMotionEvent = function DeviceMotionEvent() {};
    expect(requiresExplicitMotionPermission()).toBe(false);
  });

  it("is false when DeviceMotionEvent does not exist at all", () => {
    snapshot.set("DeviceMotionEvent", window.DeviceMotionEvent);
    delete window.DeviceMotionEvent;
    expect(requiresExplicitMotionPermission()).toBe(false);
  });
});
