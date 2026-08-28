import { describe, it, expect, vi, afterEach } from "vitest";
import { createMicrophoneController } from "../../src/diagnostics/microphoneTest.js";

const originalMediaDevices = navigator.mediaDevices;
const originalMediaRecorder = window.MediaRecorder;

function installFakes() {
  const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
  const stream = { getTracks: () => tracks };
  const recorders = [];

  class FakeMediaRecorder {
    constructor(inputStream) {
      this.stream = inputStream;
      this.mimeType = "audio/webm";
      this.ondataavailable = null;
      this.onstop = null;
      this.start = vi.fn();
      // A real MediaRecorder.stop() is async and fires onstop later; the
      // fake fires it synchronously so tests don't need to wait on it.
      this.stop = vi.fn(() => this.onstop?.());
      recorders.push(this);
    }
  }

  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn(async () => stream) },
    configurable: true,
  });
  window.MediaRecorder = FakeMediaRecorder;

  return { stream, tracks, recorders };
}

afterEach(() => {
  Object.defineProperty(navigator, "mediaDevices", { value: originalMediaDevices, configurable: true });
  window.MediaRecorder = originalMediaRecorder;
});

describe("createMicrophoneController", () => {
  it("start() requests an audio-only stream and starts a MediaRecorder", async () => {
    const { recorders } = installFakes();
    const controller = createMicrophoneController();

    await controller.start();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(recorders).toHaveLength(1);
    expect(recorders[0].start).toHaveBeenCalled();
  });

  it("collects only non-empty chunks from ondataavailable", async () => {
    const { recorders } = installFakes();
    const controller = createMicrophoneController();
    await controller.start();

    const recorder = recorders[0];
    recorder.ondataavailable({ data: { size: 0 } });
    recorder.ondataavailable({ data: new Blob(["chunk-1"]) });

    const result = await controller.stop();
    // Only the non-empty chunk should have made it into the final blob.
    expect(result.blob.size).toBe(new Blob(["chunk-1"]).size);
  });

  it("stop() resolves null when recording was never started", async () => {
    installFakes();
    const controller = createMicrophoneController();
    await expect(controller.stop()).resolves.toBeNull();
  });

  it("stop() builds a blob/url, stops the stream's tracks, and resolves both", async () => {
    const { tracks } = installFakes();
    const controller = createMicrophoneController();
    await controller.start();

    const result = await controller.stop();

    expect(result.blob).toBeInstanceOf(Blob);
    expect(typeof result.url).toBe("string");
    for (const track of tracks) expect(track.stop).toHaveBeenCalled();
  });

  it("discard() stops the stream's tracks without producing a result", async () => {
    const { tracks } = installFakes();
    const controller = createMicrophoneController();
    await controller.start();

    controller.discard();

    for (const track of tracks) expect(track.stop).toHaveBeenCalled();
  });
});
