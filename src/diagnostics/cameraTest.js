// Camera preview (section 20.5). Permission requested only on user gesture.
// No frame is captured/saved by default — this is a live preview aid, and
// it never claims access to every physical Apple lens.
export function createCameraController() {
  let stream = null;
  let currentFacingMode = "environment";

  async function start(facingMode = currentFacingMode) {
    stop();
    currentFacingMode = facingMode;
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });
    return stream;
  }

  async function switchFacing() {
    return start(currentFacingMode === "environment" ? "user" : "environment");
  }

  function stop() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  return { start, switchFacing, stop, getFacingMode: () => currentFacingMode };
}
