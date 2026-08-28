import { describe, it, expect, vi, afterEach } from "vitest";
import { createCameraController } from "../../src/diagnostics/cameraTest.js";

const originalMediaDevices = navigator.mediaDevices;

function installFakeGetUserMedia() {
  const streams = [];
  const getUserMedia = vi.fn(async () => {
    const tracks = [{ stop: vi.fn() }];
    const stream = { getTracks: () => tracks, tracks };
    streams.push(stream);
    return stream;
  });
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  return { getUserMedia, streams };
}

afterEach(() => {
  Object.defineProperty(navigator, "mediaDevices", { value: originalMediaDevices, configurable: true });
});

describe("createCameraController", () => {
  it("defaults to the rear (environment) camera", async () => {
    const { getUserMedia } = installFakeGetUserMedia();
    const controller = createCameraController();

    await controller.start();

    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: "environment" }, audio: false });
    expect(controller.getFacingMode()).toBe("environment");
  });

  it("start(facingMode) requests the given facing mode and updates state", async () => {
    const { getUserMedia } = installFakeGetUserMedia();
    const controller = createCameraController();

    await controller.start("user");

    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: "user" }, audio: false });
    expect(controller.getFacingMode()).toBe("user");
  });

  it("switchFacing() toggles between environment and user and re-requests the stream", async () => {
    const { getUserMedia } = installFakeGetUserMedia();
    const controller = createCameraController();
    await controller.start("environment");

    await controller.switchFacing();
    expect(controller.getFacingMode()).toBe("user");
    expect(getUserMedia).toHaveBeenLastCalledWith({ video: { facingMode: "user" }, audio: false });

    await controller.switchFacing();
    expect(controller.getFacingMode()).toBe("environment");
  });

  it("start() stops any previously active stream's tracks before requesting a new one", async () => {
    const { streams } = installFakeGetUserMedia();
    const controller = createCameraController();

    await controller.start("environment");
    const firstStream = streams[0];
    await controller.start("user");

    expect(firstStream.tracks[0].stop).toHaveBeenCalled();
  });

  it("stop() stops the active stream's tracks", async () => {
    const { streams } = installFakeGetUserMedia();
    const controller = createCameraController();
    await controller.start();

    controller.stop();

    expect(streams[0].tracks[0].stop).toHaveBeenCalled();
  });

  it("stop() is safe to call when no stream was ever started", () => {
    installFakeGetUserMedia();
    const controller = createCameraController();
    expect(() => controller.stop()).not.toThrow();
  });
});
