/* SimuCore — tiny observable store (no framework). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  SC.createStore = function (initial) {
    let state = { ...initial };
    const subs = new Set();
    return {
      get: () => state,
      set(patch) {
        const prev = state;
        state = { ...state, ...patch };
        subs.forEach((fn) => fn(state, prev));
      },
      subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
