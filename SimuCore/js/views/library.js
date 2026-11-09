/* SimuCore — simulation library. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.views = SC.views || {};
  const esc = SC.util.escapeHtml;
  SC.views.library = function (el) {
    el.innerHTML = `<div class="page-head"><div><div class="eyebrow">Simulation library</div><h1>Choose a model</h1><p>Each simulation documents its equations, assumptions and limits, and exports its full response as CSV.</p></div></div>
    <div class="grid-cards" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,380px),1fr))">${SC.config.order.map((id) => {
      const c = SC.config.sims[id], outputs = SC.config.buildModel(id, SC.config.defaults(id)).metrics(0).filter((m) => m.group === 'model').map((m) => m.label);
      return `<article class="card"><div class="row" style="justify-content:space-between"><div class="card-icon">${c.icon}</div><span class="chip">${esc(c.category)}</span></div><div><h3>${esc(c.name)}</h3><p style="margin-top:6px">${esc(c.blurb)}</p></div>
      <svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="${SC.sparkPath(id)}"/></svg>
      <dl class="kv"><dt>Parameters</dt><dd>${c.params.length}</dd><dt>Key outputs</dt><dd style="font-family:var(--font);text-align:right">${esc(outputs.slice(0, 3).join(', '))}</dd><dt>Model</dt><dd style="font-family:var(--font);text-align:right">${esc(c.model)}</dd></dl>
      <div class="row" style="margin-top:auto"><a class="btn btn-primary" href="#/workspace/${id}">Open simulation</a><a class="btn" href="#/docs/${id}">Documentation</a></div></article>`; }).join('')}</div>`;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
