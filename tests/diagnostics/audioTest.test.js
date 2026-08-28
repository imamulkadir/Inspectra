import { describe, it, expect, vi, afterEach } from "vitest";
import { createAudioCueController } from "../../src/diagnostics/audioTest.js";

// Minimal Web Audio API fakes — jsdom implements neither AudioContext nor
// OscillatorNode, so we model just enough of the graph-building surface
// audioTest.js touches to assert its wiring/behavior.
function makeFakeAudioContext({ withPanning = true } = {}) {
  const created = { oscillators: [], gains: [], panners: [] };

  class FakeAudioParam {
    constructor(value = 0) {
      this.value = value;
    }
  }

  class FakeOscillator {
    constructor() {
      this.type = null;
      this.frequency = new FakeAudioParam(0);
      this.connect = vi.fn();
      this.start = vi.fn();
      this.stop = vi.fn();
      this.onended = null;
    }
  }

  class FakeGain {
    constructor() {
      this.gain = {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      };
      this.connect = vi.fn();
    }
  }

  class FakePanner {
    constructor() {
      this.pan = new FakeAudioParam(0);
      this.connect = vi.fn();
    }
  }

  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = { id: "destination" };
      this.closed = false;
    }
    createOscillator() {
      const node = new FakeOscillator();
      created.oscillators.push(node);
      return node;
    }
    createGain() {
      const node = new FakeGain();
      created.gains.push(node);
      return node;
    }
    close() {
      this.closed = true;
    }
  }

  if (withPanning) {
    FakeAudioContext.prototype.createStereoPanner = function createStereoPanner() {
      const node = new FakePanner();
      created.panners.push(node);
      return node;
    };
  }

  return { FakeAudioContext, created };
}

const originalAudioContext = window.AudioContext;

afterEach(() => {
  window.AudioContext = originalAudioContext;
});

describe("createAudioCueController", () => {
  it("plays a cue by wiring oscillator -> gain -> panner -> destination and resolves when the tone ends", async () => {
    const { FakeAudioContext, created } = makeFakeAudioContext({ withPanning: true });
    window.AudioContext = FakeAudioContext;

    const controller = createAudioCueController();
    const playPromise = controller.playCue("left", { frequency: 220, durationMs: 100 });

    const oscillator = created.oscillators[0];
    const gain = created.gains[0];
    const panner = created.panners[0];

    expect(oscillator.type).toBe("sine");
    expect(oscillator.frequency.value).toBe(220);
    expect(gain.gain.setValueAtTime).toHaveBeenCalled();
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    expect(panner.pan.value).toBe(-1); // CHANNEL_PAN.left
    expect(oscillator.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(panner);
    expect(panner.connect).toHaveBeenCalledWith(expect.objectContaining({ id: "destination" }));
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();

    // The controller resolves playCue()'s promise from oscillator.onended.
    oscillator.onended();
    await expect(playPromise).resolves.toBeUndefined();
  });

  it("maps each named channel to its pan value", async () => {
    const { FakeAudioContext, created } = makeFakeAudioContext({ withPanning: true });
    window.AudioContext = FakeAudioContext;

    const controller = createAudioCueController();

    controller.playCue("center");
    created.oscillators[0].onended();
    expect(created.panners[0].pan.value).toBe(0);

    controller.playCue("right");
    created.oscillators[1].onended();
    expect(created.panners[1].pan.value).toBe(1);
  });

  it("connects gain directly to destination when the browser lacks createStereoPanner", () => {
    const { FakeAudioContext, created } = makeFakeAudioContext({ withPanning: false });
    window.AudioContext = FakeAudioContext;

    const controller = createAudioCueController();
    controller.playCue("left");

    const gain = created.gains[0];
    expect(created.panners).toHaveLength(0);
    expect(gain.connect).toHaveBeenCalledWith(expect.objectContaining({ id: "destination" }));
  });

  it("supportsPanning() reflects whether the underlying AudioContext exposes createStereoPanner", () => {
    const withPanning = makeFakeAudioContext({ withPanning: true });
    window.AudioContext = withPanning.FakeAudioContext;
    expect(createAudioCueController().supportsPanning()).toBe(true);

    const withoutPanning = makeFakeAudioContext({ withPanning: false });
    window.AudioContext = withoutPanning.FakeAudioContext;
    expect(createAudioCueController().supportsPanning()).toBe(false);
  });

  it("close() closes the underlying AudioContext and lets a later call create a fresh one", () => {
    const instances = [];
    const { FakeAudioContext } = makeFakeAudioContext({ withPanning: true });
    class TrackedAudioContext extends FakeAudioContext {
      constructor() {
        super();
        instances.push(this);
      }
    }
    window.AudioContext = TrackedAudioContext;

    const controller = createAudioCueController();
    controller.playCue("left");
    expect(instances).toHaveLength(1);
    const firstContext = instances[0];

    controller.close();
    expect(firstContext.closed).toBe(true);

    controller.playCue("left");
    expect(instances).toHaveLength(2);
  });
});
