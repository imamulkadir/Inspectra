// Locally generated audio cues (section 20.3) — pure oscillator tones
// panned left/center/right via the Web Audio API. No copyrighted or bundled
// audio assets are used. This is a listening aid for balance/distortion/
// rattling observation, not frequency calibration.
const CHANNEL_PAN = { left: -1, center: 0, right: 1 };

export function createAudioCueController() {
  let audioContext = null;

  function ensureContext() {
    if (!audioContext) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      audioContext = new Ctor();
    }
    return audioContext;
  }

  function playCue(channel, { frequency = 440, durationMs = 700 } = {}) {
    const ctx = ensureContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

    oscillator.connect(gain);
    if (panner) {
      panner.pan.value = CHANNEL_PAN[channel] ?? 0;
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      gain.connect(ctx.destination);
    }

    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000 + 0.05);

    return new Promise((resolve) => {
      oscillator.onended = resolve;
    });
  }

  function close() {
    audioContext?.close?.();
    audioContext = null;
  }

  return { playCue, close, supportsPanning: () => Boolean(ensureContext().createStereoPanner) };
}
