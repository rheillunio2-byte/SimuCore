/* SimuCore — documentation and help. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.views = SC.views || {};
  const esc = SC.util.escapeHtml;
  const TOPICS = [['guide', 'Getting started'], ...SC.config.order.map((id) => [id, SC.config.sims[id].short]), ['accuracy', 'Accuracy & limits']];

  const guide = () => `<h2>Getting started</h2><div class="prose"><p>Pick a simulation in the <a href="#/library">Library</a>, then adjust parameters in the Workspace. Changing a parameter rebuilds the model and returns playback to <em>t = 0</em>.</p>
    <h3>Workspace controls</h3><ul class="list"><li><strong>Run / Pause / Replay</strong> start and stop playback; <strong>Step</strong> advances 1 % of the run; <strong>Reset</strong> returns to t = 0.</li><li>The <strong>timeline</strong> and the <strong>chart</strong> can both be dragged to scrub through time.</li><li><strong>Speed</strong> scales playback. Very short or very long runs are time-scaled so they stay watchable; the viewport states the factor.</li><li>Every parameter has a slider and an exact numeric field; values outside the range are limited and reported.</li></ul>
    <h3>Experiments</h3><p>“Save experiment” stores the parameter set under a name in your browser. Manage saved sets under <a href="#/experiments">Experiments</a>: open, rename, delete, export to CSV, back up as JSON, or compare several.</p>
    <h3>CSV format</h3><p>The first lines start with <code>#</code> and record the simulation and its parameters; the header row follows, then 501 evenly spaced samples. Most tools skip the metadata with a comment option (e.g. <code>pandas.read_csv(path, comment='#')</code>).</p>
    <h3>Keyboard shortcuts</h3><p><kbd>Space</kbd> run / pause · <kbd>S</kbd> step · <kbd>R</kbd> reset (in the workspace, when no field is focused). Dialogs close with <kbd>Esc</kbd>.</p></div>`;
  const sim = (id) => { const c = SC.config.sims[id]; return `<h2>${esc(c.name)}</h2><p class="muted" style="margin:6px 0 16px">${esc(c.blurb)}</p><h3 style="margin-bottom:10px">Equations</h3>${c.docs.equations.map((e) => `<div class="eq">${esc(e)}</div>`).join('')}
    <h3 style="margin:20px 0 10px">Assumptions</h3><ul class="list">${c.docs.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul><h3 style="margin:20px 0 10px">Parameters</h3>
    <div class="table-wrap"><table><thead><tr><th>Parameter</th><th>Unit</th><th>Range</th><th>Default</th></tr></thead><tbody>${c.params.map((p) => `<tr><td>${esc(p.label)}</td><td class="num-cell">${esc(p.unit || '—')}</td><td class="num-cell">${p.type === 'choice' ? p.options.map((o) => esc(o[1])).join(' / ') : `${p.min} – ${p.max}`}</td><td class="num-cell">${p.type === 'choice' ? esc((p.options.find((o) => o[0] === p.def) || [, p.def])[1]) : p.def}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted" style="margin:16px 0">${esc(c.docs.notes)}</p><a class="btn btn-primary" href="#/workspace/${id}">Open ${esc(c.short)}</a>`; };
  const accuracy = () => `<h2>Accuracy &amp; limits</h2><div class="prose"><p>SimuCore teaches and explores idealised models. It is <strong>not</strong> validated engineering design software and must not be used for safety-critical decisions.</p>
    <h3>What is verified</h3><ul class="list"><li>Closed-form results (projectile range, RC time constant, spring responses) are checked against independent calculations in the automated test suite.</li><li>The pendulum's RK4 solution is checked against the small-angle solution, the exact large-amplitude period, and energy conservation.</li><li>The spring's closed form is cross-checked against RK4 for undamped, under-, critically and over-damped cases.</li><li>Parameter corners of every simulation are tested to stay finite — the interface never displays NaN or Infinity (shown as “—” if a value is undefined).</li></ul>
    <h3>What is not modelled</h3><ul class="list"><li>Air resistance, spin, Earth's curvature and rotation (projectile).</li><li>Rod mass, pivot geometry, friction other than linear damping (pendulum).</li><li>Spring mass, nonlinear stiffness, Coulomb friction, external forcing (spring–mass).</li><li>Leakage, ESR, tolerances, temperature, switching dynamics (RC circuit).</li></ul>
    <h3>Numerical notes</h3><p>RK4 with a step of at most 2 ms is used for the pendulum; runs are limited to 60 s of simulated time. Charts and CSV files are sampled from the same model functions that drive the viewport, so they always agree.</p></div>`;

  SC.views.docs = function (el, ctx, args) {
    const topic = TOPICS.some((t) => t[0] === args[0]) ? args[0] : 'guide';
    el.innerHTML = `<div class="page-head"><div><div class="eyebrow">Documentation</div><h1>Help &amp; models</h1></div></div>
      <div class="tabs" role="tablist" aria-label="Documentation topics" style="margin-bottom:20px;display:inline-flex;max-width:100%">${TOPICS.map(([k, l]) => `<a class="tab" role="tab" href="#/docs/${k}" aria-selected="${k === topic}" style="text-decoration:none">${esc(l)}</a>`).join('')}</div>
      <section class="panel"><div class="panel-body" style="padding:clamp(16px,3vw,30px)">${topic === 'guide' ? guide() : topic === 'accuracy' ? accuracy() : sim(topic)}</div></section>`;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
