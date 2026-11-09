/* SimuCore — application bootstrap: settings, router, view lifecycle. */
(function () {
  'use strict';
  const SC = window.SimuCore;
  const TITLES = { overview: 'Overview', library: 'Simulation Library', workspace: 'Workspace', experiments: 'Experiments', docs: 'Documentation', settings: 'Settings' };
  const DEFAULT_SETTINGS = { motion: 'system', speed: '1' };

  let settings = { ...DEFAULT_SETTINGS, ...SC.storage.get('settings', {}) };
  let workspaceValues = SC.storage.get('workspace', {}), saveTimer = 0;
  const applyMotion = () => { const h = document.documentElement; h.classList.toggle('reduce-motion', settings.motion === 'reduced'); h.classList.toggle('full-motion', settings.motion === 'full'); };
  applyMotion();

  const ctx = {
    settings: { get: () => settings, set(patch) { settings = { ...settings, ...patch }; SC.storage.set('settings', settings); applyMotion(); } },
    workspace: {
      get: (id) => SC.config.normalize(id, workspaceValues[id]),
      set(id, values) { workspaceValues[id] = values; clearTimeout(saveTimer); saveTimer = setTimeout(() => SC.storage.set('workspace', workspaceValues), 250); },
      lastSim: () => { const s = SC.storage.get('lastSim', 'projectile'); return SC.config.sims[s] ? s : 'projectile'; },
    },
    navigate: (path) => { location.hash = path; },
    openExperiment(id) {
      const exp = SC.experiments.get(id); if (!exp) { SC.notify.toast('That experiment no longer exists.', 'error'); return; }
      ctx.workspace.set(exp.sim, SC.config.normalize(exp.sim, exp.params)); ctx.navigate('#/workspace/' + exp.sim); SC.notify.toast(`Opened “${exp.name}”.`, 'success');
    },
    resetAll() { SC.storage.clearAll(); settings = { ...DEFAULT_SETTINGS }; workspaceValues = {}; applyMotion(); },
  };
  SC.app = ctx;

  const nav = document.getElementById('nav'); let view = document.getElementById('view');
  SC.navigation.renderSidebar(nav, ctx.workspace.lastSim());
  let cleanup = null, first = true;

  function render() {
    if (typeof cleanup === 'function') { try { cleanup(); } catch (e) { console.error(e); } } cleanup = null;
    const { route, args } = SC.navigation.parse(location.hash);
    if (route === 'workspace' && !SC.config.sims[args[0]]) { location.replace('#/workspace/' + ctx.workspace.lastSim()); return; }
    if (route === 'workspace') SC.storage.set('lastSim', args[0]);
    SC.navigation.setActive(nav, route, ctx.workspace.lastSim());
    // fresh container per navigation so views never accumulate listeners on a shared element
    const fresh = document.createElement('main'); fresh.id = 'view'; fresh.tabIndex = -1; fresh.className = 'view view-enter'; view.replaceWith(fresh); view = fresh;
    if (!route) {
      view.innerHTML = '<div class="empty"><h3>Page not found</h3><p>That page does not exist in SimuCore.</p><a class="btn btn-primary" href="#/overview">Back to overview</a></div>'; document.title = 'Not found · SimuCore';
    } else {
      document.title = `${route === 'workspace' ? SC.config.sims[args[0]].name + ' · ' : ''}${TITLES[route]} · SimuCore`;
      try { cleanup = SC.views[route](view, ctx, args); } catch (err) { console.error(err); view.innerHTML = '<div class="empty"><h3>Something went wrong</h3><p>This page failed to load. Check the browser console for details.</p></div>'; SC.notify.toast('Could not load this page.', 'error'); }
    }
    window.scrollTo(0, 0); if (!first) view.focus({ preventScroll: true }); first = false;
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('pagehide', () => SC.storage.set('workspace', workspaceValues));
  window.addEventListener('error', (e) => console.error('SimuCore error:', e.message));
  if (!location.hash) history.replaceState(null, '', '#/overview');
  render();
  if (!SC.storage.persistent) setTimeout(() => SC.notify.toast('Browser storage is unavailable — saved experiments will last for this session only.', 'warn', 6000), 1200);

  // splash: logo reveal, then fade out
  const splash = document.getElementById('splash');
  const hide = () => { splash.classList.add('is-hidden'); setTimeout(() => splash.remove(), 600); };
  if (SC.motion.reduced()) hide(); else setTimeout(hide, 1500);
})();
