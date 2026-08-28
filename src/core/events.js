export function createEventBus() {
  const listeners = new Map();

  function on(eventName, handler) {
    if (!listeners.has(eventName)) listeners.set(eventName, new Set());
    listeners.get(eventName).add(handler);
    return () => off(eventName, handler);
  }

  function off(eventName, handler) {
    listeners.get(eventName)?.delete(handler);
  }

  function emit(eventName, payload) {
    for (const handler of listeners.get(eventName) ?? []) {
      handler(payload);
    }
  }

  return { on, off, emit };
}

export const appEvents = createEventBus();
