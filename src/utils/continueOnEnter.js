// Makes Enter trigger the current step's primary "Continue" action no
// matter what has focus — not just when the Continue button itself happens
// to be focused. This matters because most inspection questions are answered
// by tapping an option button, and on many browsers/platforms a mouse or
// touch click on a <button> does NOT give it keyboard focus (Safari/Firefox
// never do; Chrome only on some platforms) — so after answering, Enter had
// nowhere to go and silently did nothing.
//
// Safe even when an option/Continue button IS currently focused: calling
// preventDefault() here (whenever canContinue() is true) suppresses that
// button's native Enter-activates-click default action for the *whole*
// dispatch, not just at the node that called it — so it can't also fire and
// double-invoke the same action. When canContinue() is false, preventDefault
// is deliberately skipped so a focused-but-not-yet-selected option button
// still activates normally on Enter.
//
// Callers should call the returned unbind() and re-bind on every render()
// (canContinue/onContinue close over that render's local state, e.g. the
// current rule/step index) — see inspectionPage.js/resetVerificationPage.js.
export function bindEnterToContinue(canContinue, onContinue) {
  function handleKeydown(event) {
    if (event.key !== "Enter") return;
    if (!canContinue()) return;
    event.preventDefault();
    onContinue();
  }

  document.addEventListener("keydown", handleKeydown);
  return () => document.removeEventListener("keydown", handleKeydown);
}
