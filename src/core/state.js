import { APP_STATUS } from "./constants.js";

function initialState() {
  return {
    app: {
      status: APP_STATUS.BOOTING,
      route: null,
      online: navigator.onLine,
      updateAvailable: false,
    },
    dataset: {
      manifest: null,
      validation: null,
      loadedFeatures: [],
      loadErrors: [],
    },
    identification: {
      device: null,
      variant: null,
      aNumberInput: null,
      aNumberResolution: null,
      storage: null,
      finish: null,
      iosVersion: null,
      iosParsed: null,
      identityInconsistencies: [],
    },
    inspection: {
      id: null,
      profileId: null,
      datasetVersion: null,
      policyVersions: {},
      disclaimerAcceptance: null,
      context: null,
      orderedRuleIds: [],
      currentRuleIndex: 0,
      answers: {},
      findings: [],
      identityFindings: [],
      resetVerification: {},
      startedAt: null,
      updatedAt: null,
      completedAt: null,
    },
  };
}

export function createStore() {
  let state = initialState();
  const subscribers = new Set();

  function getState() {
    return state;
  }

  // updater receives the previous state and must return a new object for
  // the branch it changes; unrelated branches are preserved by reference so
  // subscribers can cheaply diff if they choose to.
  function setState(updater) {
    const patch = typeof updater === "function" ? updater(state) : updater;
    state = { ...state, ...patch };
    for (const subscriber of subscribers) subscriber(state);
    return state;
  }

  function subscribe(subscriber) {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }

  function reset() {
    state = initialState();
    for (const subscriber of subscribers) subscriber(state);
  }

  return { getState, setState, subscribe, reset };
}

export const store = createStore();
