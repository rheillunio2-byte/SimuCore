/* SimuCore — active simulation workspace. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.views = SC.views || {};
  const { fmt, fmtSI, escapeHtml: esc } = SC.util;
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = { play: I('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'), pause: I('<path d="M8 5v14M16 5v14"/>'), step: I('<path d="M5 5v14l9-7zM18 5v14"/>'), reset: I('<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>'), save: I('<path d="M5 3h11l3 3v15H5zM8 3v6h7M8 21v-7h8v7"/>'), csv: I('<path d="M12 3v12m0 0-4-4m4 4 4-4M4 20h16"/>') };
  const STATUS = { ready: ['Ready', ''], running: ['Running', 'is-running'], paused: ['Paused', 'is-paused'], complete: ['Complete', 'is-complete'] };

  SC.views.workspace = function (root_, ctx, args) {
    const id = args[0], cfg = SC.config.sims[id];
    let values = SC.config.normalize(id, ctx.workspace.get(id)), model = SC.config.buildModel(id, values), chartDef = cfg.charts[0], pending = 0;
    root_.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Simulation workspace · ${esc(cfg.category)}</div><h1>${esc(cfg.name)}</h1><p>${esc(cfg.model)}. All quantities in SI units unless a control states otherwise.</p></div>
      <nav class="sim-switch" aria-label="Choose simulation">${SC.config.order.map((k) => `<a href="#/workspace/${k}" ${k === id ? 'aria-current="page"' : ''}>${SC.config.sims[k].icon}${esc(SC.config.sims[k].short)}</a>`).join('')}</nav></div>
    <div class="ws-grid"><div class="ws-main">
      <section class="panel" aria-label="Simulation viewport"><div class="panel-head"><div><div class="panel-title">Viewport</div><div class="panel-meta">${esc(cfg.viewLabel)}</div></div><span class="chip" id="status" role="status">Ready</span></div>
        <div class="viewport"><canvas id="scene" role="img" aria-label="Animated ${esc(cfg.name)} simulation"></canvas><div class="viewport-time" id="vtime">t = 0 s</div><div class="viewport-note" id="vnote"></div></div>
        <div class="playbar"><button class="btn btn-primary" id="play" type="button" aria-keyshortcuts="Space">${ICON.play}<span>Run</span></button><button class="btn" id="step" type="button" aria-keyshortcuts="S">${ICON.step}<span>Step</span></button><button class="btn" id="reset" type="button" aria-keyshortcuts="R">${ICON.reset}<span>Reset</span></button>
          <input class="timeline" id="timeline" type="range" min="0" max="1000" step="1" value="0" aria-label="Simulation time"><label class="row" for="speed"><span class="panel-meta">Speed</span><select class="select" id="speed"><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div></section>
      <div class="metrics-group"><h2 class="metrics-title">Live measurements</h2><div class="metrics" id="m-live"></div></div>
      <div class="metrics-group"><h2 class="metrics-title">Model properties</h2><div class="metrics" id="m-model"></div></div>
      <section class="panel" aria-label="Response analysis"><div class="panel-head"><div class="panel-title">Response analysis</div><div class="tabs" role="tablist" aria-label="Chart variable">${cfg.charts.map((c, i) => `<button class="tab" role="tab" type="button" data-chart="${c.id}" aria-selected="${i === 0}">${esc(c.label)}</button>`).join('')}</div></div><div class="panel-body"><div class="chart-wrap"><canvas id="chart" role="img" aria-label="Response chart"></canvas></div><p class="panel-meta" style="margin-top:8px">Drag across the chart to scrub the simulation. Curves are sampled from the same model that drives the viewport.</p></div></section>
      <section class="panel" aria-label="Model description"><div class="panel-head"><div class="panel-title">Mathematical model</div><a class="panel-meta" href="#/docs/${id}">Full documentation →</a></div><div class="panel-body two-col"><div>${cfg.docs.equations.map((e) => `<div class="eq">${esc(e)}</div>`).join('')}</div><div><h3 style="font-size:13px;margin-bottom:8px">Assumptions</h3><ul class="list">${cfg.docs.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div></div></section>
    </div><aside class="ws-side" aria-label="Parameters and experiments">
      <section class="panel"><div class="panel-head"><div class="panel-title">Parameters</div><button class="btn btn-sm btn-ghost" id="defaults" type="button">Restore defaults</button></div><div class="panel-body" id="controls"></div></section>
      <section class="panel"><div class="panel-head"><div class="panel-title">Experiments</div><a class="panel-meta" href="#/experiments">Manage all →</a></div><div class="panel-body"><div class="row"><button class="btn btn-primary" id="save" type="button">${ICON.save}<span>Save experiment</span></button><button class="btn" id="csv" type="button">${ICON.csv}<span>Export CSV</span></button></div><div class="saved-mini" id="saved"></div></div></section>
    </aside></div>`;

    const $ = (s) => root_.querySelector(s), canvas = $('#scene');
    const viewport = new SC.Viewport(canvas, id);
    const chart = new SC.Chart($('#chart'), { onSeek: (t) => { engine.pause(); engine.seek(t); } });
    const engine = new SC.Engine({ onFrame, onStatus });
    engine.setSpeed(Number(ctx.settings.get().speed) || 1); $('#speed').value = String(engine.speed);

    /* --- metrics tiles: structure rebuilt per model, text updated per frame --- */
    let tiles = []; // DOM order = live tiles then model tiles = the order each simulation lists its metrics
    function buildMetrics() {
      const list = model.metrics(0), mk = (g) => list.filter((m) => m.group === g).map((m) => `<div class="metric ${g}"><div class="metric-label" title="${esc(m.label)}">${esc(m.label)}</div><div class="metric-value"></div><div class="metric-note">${m.note ? esc(m.note) : '&nbsp;'}</div></div>`).join('');
      $('#m-live').innerHTML = mk('live'); $('#m-model').innerHTML = mk('model'); tiles = [...root_.querySelectorAll('.metric')];
    }
    function paintMetrics(t) {
      model.metrics(t).forEach((m, i) => {
        const el = tiles[i]; if (!el) return; const cell = el.querySelector('.metric-value');
        let text, unit = m.unit; if (m.text) text = m.text; else if (m.si) { const f = fmtSI(m.value, m.unit); text = f.text; unit = f.unit; } else text = fmt(m.value, m.digits);
        const html = `${esc(text)}${unit ? `<small>${esc(unit)}</small>` : ''}`; if (cell.innerHTML !== html) cell.innerHTML = html;
        if (m.note && el.querySelector('.metric-note').textContent !== m.note) el.querySelector('.metric-note').textContent = m.note;
      });
    }
    function onFrame(t) {
      viewport.update(model, t); chart.setCursor(t); paintMetrics(t);
      const ts = fmtSI(t, 's'), ds = fmtSI(model.duration, 's');
      $('#vtime').textContent = `t = ${ts.text} ${ts.unit}  /  ${ds.text} ${ds.unit}`; $('#timeline').value = Math.round((t / model.duration) * 1000);
      $('#timeline').setAttribute('aria-valuetext', `${ts.text} ${ts.unit} of ${ds.text} ${ds.unit}`);
    }
    function onStatus(s) {
      const [label, cls] = STATUS[s], chip = $('#status'); chip.textContent = label; chip.className = 'chip ' + cls;
      $('#play span').textContent = s === 'running' ? 'Pause' : s === 'complete' ? 'Replay' : 'Run'; $('#play').firstElementChild.outerHTML = s === 'running' ? ICON.pause : ICON.play;
    }
    function note() {
      const rate = model.timeScale * engine.speed, n = $('#vnote');
      if (Math.abs(model.timeScale - 1) < 1e-9) n.textContent = ''; else { const f = fmtSI(rate, 's'); n.textContent = `Playback: 1 s of real time = ${f.text} ${f.unit} simulated`; }
    }
    function recompute(animate) {
      pending = 0; values = SC.config.normalize(id, values); model = SC.config.buildModel(id, values);
      buildMetrics(); engine.setModel(model, false); chart.setData(chartDef, model.sample(300), model.duration, { animate }); note();
    }
    const schedule = () => { if (!pending) pending = requestAnimationFrame(() => recompute(false)); };

    const controls = SC.createControls($('#controls'), id, values, {
      onChange(_k, _v, all) { values = all; ctx.workspace.set(id, values); schedule(); },
    });

    /* --- playback wiring --- */
    $('#play').addEventListener('click', () => engine.toggle());
    $('#step').addEventListener('click', () => engine.step());
    $('#reset').addEventListener('click', () => engine.reset());
    $('#speed').addEventListener('change', (e) => { engine.setSpeed(Number(e.target.value)); ctx.settings.set({ speed: e.target.value }); note(); });
    $('#timeline').addEventListener('input', (e) => { engine.pause(); engine.seek((Number(e.target.value) / 1000) * model.duration); });
    root_.querySelectorAll('[data-chart]').forEach((b) => b.addEventListener('click', () => {
      chartDef = cfg.charts.find((c) => c.id === b.dataset.chart); root_.querySelectorAll('[data-chart]').forEach((x) => x.setAttribute('aria-selected', x === b));
      chart.setData(chartDef, model.sample(300), model.duration, { animate: true }); chart.setCursor(engine.t);
    }));
    $('#defaults').addEventListener('click', () => { values = SC.config.defaults(id); controls.setValues(values); ctx.workspace.set(id, values); recompute(true); SC.notify.toast('Parameters restored to defaults.', 'success'); });

    /* --- experiments --- */
    function renderSaved() {
      const list = SC.experiments.list().filter((e) => e.sim === id).slice(0, 5), box = $('#saved');
      box.innerHTML = list.length ? list.map((e) => `<div class="item"><span title="${esc(e.name)}">${esc(e.name)}</span><button class="btn btn-sm" data-load="${e.id}" type="button" aria-label="Load ${esc(e.name)}">Load</button></div>`).join('') : '<p class="panel-meta">No saved experiments for this simulation yet.</p>';
    }
    $('#saved').addEventListener('click', (e) => {
      const b = e.target.closest('[data-load]'); if (!b) return; const exp = SC.experiments.get(b.dataset.load); if (!exp) return;
      values = SC.config.normalize(id, exp.params); controls.setValues(values); ctx.workspace.set(id, values); recompute(true); SC.notify.toast(`Loaded “${exp.name}”.`, 'success');
    });
    $('#save').addEventListener('click', async () => {
      const n = SC.experiments.list().filter((e) => e.sim === id).length + 1;
      const name = await SC.notify.promptText({ title: 'Save experiment', label: 'Experiment name', value: `${cfg.short} experiment ${n}` }); if (!name) return;
      const { persisted } = SC.experiments.add(id, name, values);
      SC.notify.toast(persisted ? `Saved “${name}”.` : `Saved “${name}” for this session only — browser storage is unavailable.`, persisted ? 'success' : 'warn');
    });
    $('#csv').addEventListener('click', () => {
      try { const n = SC.exportCSV(id, values); SC.notify.toast(`Exported ${n} samples to CSV.`, 'success'); }
      catch (err) { SC.notify.toast('CSV export failed: ' + err.message, 'error'); }
    });
    const unsub = SC.experiments.subscribe(renderSaved);

    /* --- keyboard shortcuts --- */
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.modal-backdrop')) return;
      const tag = e.target.tagName; if (/INPUT|SELECT|TEXTAREA/.test(tag) || e.target.isContentEditable) return;
      if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); engine.toggle(); }
      else if (e.key.toLowerCase() === 'r') engine.reset(); else if (e.key.toLowerCase() === 's') engine.step();
    }
    document.addEventListener('keydown', onKey);

    renderSaved(); recompute(true);
    return () => { engine.destroy(); viewport.destroy(); chart.destroy(); unsub(); document.removeEventListener('keydown', onKey); cancelAnimationFrame(pending); };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
