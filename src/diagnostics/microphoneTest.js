// Microphone record/playback (section 20.4). Permission is only requested
// when the caller invokes start() in direct response to a user gesture.
// Audio stays in memory as an object URL; it is never persisted unless the
// caller explicitly attaches it as evidence (evidenceRepository.addEvidence).
export function createMicrophoneController() {
  let stream = null;
  let recorder = null;
  let chunks = [];
  let objectUrl = null;

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.start();
    return stream;
  }

  function stop() {
    return new Promise((resolve) => {
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        releaseUrl();
        objectUrl = URL.createObjectURL(blob);
        stream?.getTracks().forEach((track) => track.stop());
        resolve({ blob, url: objectUrl });
      };
      recorder.stop();
    });
  }

  function releaseUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  function discard() {
    releaseUrl();
    chunks = [];
    stream?.getTracks().forEach((track) => track.stop());
  }

  return { start, stop, discard };
}
