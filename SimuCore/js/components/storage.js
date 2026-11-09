/* SimuCore — persistence (localStorage with in-memory fallback) and the saved-experiments store. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  const PREFIX = 'simucore.v1.';
  const memory = new Map();
  let persistent = false;
  try { const k = PREFIX + '__probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); persistent = true; } catch (_) { persistent = false; }

  const storage = {
    get persistent() { return persistent; },
    get(key, fallback) {
      try {
        const raw = persistent ? localStorage.getItem(PREFIX + key) : memory.get(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (_) { return fallback; }
    },
    /** @returns {boolean} true when the value was stored */
    set(key, value) {
      const raw = JSON.stringify(value);
      memory.set(key, raw);
      if (!persistent) return false;
      try { localStorage.setItem(PREFIX + key, raw); return true; } catch (_) { return false; } // quota / privacy mode
    },
    remove(key) { memory.delete(key); if (persistent) try { localStorage.removeItem(PREFIX + key); } catch (_) { /* ignore */ } },
    clearAll() {
      memory.clear();
      if (persistent) try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch (_) { /* ignore */ }
    },
  };

  /* ---- experiments ---- */
  const store = SC.createStore({ items: storage.get('experiments', []).filter((e) => e && SC.config.sims[e.sim]) });
  const save = () => storage.set('experiments', store.get().items);
  const experiments = {
    subscribe: store.subscribe,
    list: () => store.get().items,
    get: (id) => store.get().items.find((e) => e.id === id),
    add(sim, name, params) {
      const now = new Date().toISOString();
      const exp = { id: SC.util.uid(), name: name.trim().slice(0, 60), sim, params: SC.config.normalize(sim, params), createdAt: now, updatedAt: now };
      store.set({ items: [exp, ...store.get().items] });
      return { exp, persisted: save() };
    },
    rename(id, name) { store.set({ items: store.get().items.map((e) => (e.id === id ? { ...e, name: name.trim().slice(0, 60), updatedAt: new Date().toISOString() } : e)) }); return save(); },
    remove(id) { store.set({ items: store.get().items.filter((e) => e.id !== id) }); return save(); },
    clear() { store.set({ items: [] }); save(); },
    exportJSON: () => JSON.stringify({ app: 'SimuCore', version: 1, experiments: store.get().items }, null, 2),
    /** Merge a JSON export. Unknown simulations are skipped; parameters are re-validated. */
    importJSON(text) {
      const data = JSON.parse(text);
      const incoming = Array.isArray(data) ? data : data && data.experiments;
      if (!Array.isArray(incoming)) throw new Error('No experiments found in file.');
      const have = new Set(store.get().items.map((e) => e.id)); let added = 0, skipped = 0; const fresh = [];
      incoming.forEach((e) => {
        if (!e || typeof e.name !== 'string' || !SC.config.sims[e.sim] || have.has(e.id)) { skipped++; return; }
        fresh.push({ id: e.id || SC.util.uid(), name: e.name.slice(0, 60), sim: e.sim, params: SC.config.normalize(e.sim, e.params), createdAt: e.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }); added++;
      });
      store.set({ items: [...fresh, ...store.get().items] }); save();
      return { added, skipped };
    },
  };
  SC.storage = storage; SC.experiments = experiments;
})(typeof globalThis !== 'undefined' ? globalThis : this);
