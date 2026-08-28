import { describe, it, expect, vi, afterEach } from "vitest";
import { requestMotionPermission, createMotionController } from "../../src/diagnostics/motionTest.js";

const originalDeviceMotionEvent = window.DeviceMotionEvent;

afterEach(() => {
  window.DeviceMotionEvent = originalDeviceMotionEvent;
});

describe("requestMotionPermission", () => {
  it("calls DeviceMotionEvent.requestPermission and forwards its result when present (iOS 13+ Safari)", async () => {
    window.DeviceMotionEvent = function DeviceMotionEvent() {};
    window.DeviceMotionEvent.requestPermission = vi.fn(async () => "denied");

    await expect(requestMotionPermission()).resolves.toBe("denied");
    expect(window.DeviceMotionEvent.requestPermission).toHaveBeenCalled();
  });

  it("resolves 'granted' without prompting when requestPermission does not exist", async () => {
    window.DeviceMotionEvent = function DeviceMotionEvent() {};
    await expect(requestMotionPermission()).resolves.toBe("granted");
  });

  it("resolves 'granted' when DeviceMotionEvent itself does not exist", async () => {
    delete window.DeviceMotionEvent;
    await expect(requestMotionPermission()).resolves.toBe("granted");
  });
});

describe("createMotionController", () => {
  it("start() subscribes and delivers transformed motion data to onMotion", () => {
    const onMotion = vi.fn();
    const controller = createMotionController({ onMotion });
    controller.start();

    const event = new Event("devicemotion");
    event.acceleration = { x: 1, y: 2, z: 3 };
    event.accelerationIncludingGravity = { x: 4, y: 5, z: 6 };
    event.rotationRate = { alpha: 7, beta: 8, gamma: 9 };
    window.dispatchEvent(event);

    expect(onMotion).toHaveBeenCalledWith({
      acceleration: { x: 1, y: 2, z: 3 },
      accelerationIncludingGravity: { x: 4, y: 5, z: 6 },
      rotationRate: { alpha: 7, beta: 8, gamma: 9 },
    });

    controller.stop();
  });

  it("passes through null for absent acceleration/rotationRate vectors instead of throwing", () => {
    const onMotion = vi.fn();
    const controller = createMotionController({ onMotion });
    controller.start();

    const event = new Event("devicemotion");
    // acceleration, accelerationIncludingGravity, rotationRate all absent.
    window.dispatchEvent(event);

    expect(onMotion).toHaveBeenCalledWith({
      acceleration: null,
      accelerationIncludingGravity: null,
      rotationRate: null,
    });

    controller.stop();
  });

  it("start() subscribes and delivers orientation data to onOrientation", () => {
    const onOrientation = vi.fn();
    const controller = createMotionController({ onOrientation });
    controller.start();

    const event = new Event("deviceorientation");
    event.alpha = 10;
    event.beta = 20;
    event.gamma = 30;
    window.dispatchEvent(event);

    expect(onOrientation).toHaveBeenCalledWith({ alpha: 10, beta: 20, gamma: 30 });

    controller.stop();
  });

  it("stop() unsubscribes so further events are not delivered", () => {
    const onMotion = vi.fn();
    const controller = createMotionController({ onMotion });
    controller.start();
    controller.stop();

    window.dispatchEvent(new Event("devicemotion"));

    expect(onMotion).not.toHaveBeenCalled();
  });

  it("tolerates missing onMotion/onOrientation callbacks", () => {
    const controller = createMotionController();
    controller.start();
    expect(() => window.dispatchEvent(new Event("devicemotion"))).not.toThrow();
    expect(() => window.dispatchEvent(new Event("deviceorientation"))).not.toThrow();
    controller.stop();
  });
});
