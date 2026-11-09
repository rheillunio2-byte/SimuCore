/* SimuCore — overview / laboratory landing page. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.views = SC.views || {};
  const esc = SC.util.escapeHtml;

  /** Real response curve of a simulation at default parameters, as an SVG path. */
  function sparkPath(id) {
    const cfg = SC.config.sims[id], rows = SC.config.buildModel(id, SC.config.defaults(id)).sample(80), key = cfg.charts[0].series[0].key;
    const v = rows.map((r) => r[key]), lo = Math.min(...v), hi = Math.max(...v), span = hi - lo || 1;
    return 'M' + v.map((y, i) => `${((i / (v.length - 1)) * 100).toFixed(2)},${(36 - ((y - lo) / span) * 32).toFixed(2)}`).join(' L');
  }
  SC.sparkPath = sparkPath;

  SC.views.overview = function (el, ctx) {
    const exps = SC.experiments.list();
    el.innerHTML = `
    <section class="panel" style="padding:clamp(22px,4vw,44px);display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.7fr);gap:30px;align-items:center;background:linear-gradient(135deg,rgba(25,40,76,.75),rgba(11,17,34,.9))">
      <div><div class="eyebrow">Engineering simulation studio</div><h1 style="font-size:clamp(30px,4.6vw,52px);letter-spacing:-.03em;line-height:1.06">Model. Measure.<br>Understand.</h1>
        <p class="muted" style="margin:16px 0 24px;max-width:56ch;font-size:15px">SimuCore is a browser-based laboratory for four idealised physical systems. Every number on screen comes from the model equations — documented, tested and exportable.</p>
        <div class="row"><a class="btn btn-primary" href="#/workspace/${ctx.workspace.lastSim()}">Open workspace</a><a class="btn" href="#/library">Browse simulations</a></div></div>
      <div class="hero-logo" aria-hidden="true" style="display:grid;place-items:center"><svg viewBox="0 0 64 64" style="width:min(240px,60%);height:auto"><defs><linearGradient id="hg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5B9BFF"/><stop offset="1" stop-color="#35D3E3"/></linearGradient></defs><path d="M32 6 54.5 19v26L32 58 9.5 45V19Z" fill="none" stroke="url(#hg)" stroke-width="2.2" stroke-linejoin="round"/><path class="s-trace" pathLength="1" d="M54.5 19C44 19 40 28 32 32S20 45 9.5 45" fill="none" stroke="#EAF2FF" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="32" r="10" fill="none" stroke="#8B7CF6" stroke-width=".9" stroke-dasharray="2 3"/><circle cx="32" cy="32" r="4.2" fill="#35D3E3"/><circle cx="54.5" cy="19" r="2.8" fill="#5B9BFF"/><circle cx="9.5" cy="45" r="2.8" fill="#5B9BFF"/></svg></div></section>
    <div class="section"><div class="stat-row"><div class="stat"><b>4</b><span>Simulations</span></div><div class="stat"><b>${exps.length}</b><span>Saved experiments</span></div><div class="stat"><b>SI</b><span>Units end-to-end</span></div><div class="stat"><b>${SC.storage.persistent ? 'Local' : 'Session'}</b><span>${SC.storage.persistent ? 'Stored in this browser' : 'Storage unavailable — memory only'}</span></div></div></div>
    <div class="section"><h2>Simulations</h2><div class="grid-cards">${SC.config.order.map((id) => { const c = SC.config.sims[id]; return `<a class="card" href="#/workspace/${id}" style="color:inherit;text-decoration:none"><div class="card-icon">${c.icon}</div><div><h3>${esc(c.name)}</h3><p>${esc(c.category)}</p></div><svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="${sparkPath(id)}"/></svg><span class="panel-meta">Open workspace →</span></a>`; }).join('')}</div></div>
    <div class="section"><h2>Recent experiments</h2>${exps.length ? `<div class="exp-list">${exps.slice(0, 3).map((e) => `<div class="exp" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="exp-name">${esc(e.name)}</div><div class="exp-meta">${esc(SC.config.sims[e.sim].name)} · ${new Date(e.createdAt).toLocaleString()}</div></div><button class="btn btn-sm" data-open="${e.id}" type="button">Open</button></div>`).join('')}</div>` : `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${SC.navigation.ICONS.experiments.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg><h3>No experiments yet</h3><p>Tune a simulation, then use “Save experiment” to keep the configuration.</p><a class="btn" href="#/workspace/${ctx.workspace.lastSim()}">Start an experiment</a></div>`}</div>`;
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) ctx.openExperiment(b.dataset.open); });
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
