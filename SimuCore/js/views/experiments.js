/* SimuCore — saved experiments: load, rename, delete, export, compare. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.views = SC.views || {};
  const { escapeHtml: esc, fmt, fmtSI } = SC.util;

  SC.views.experiments = function (el, ctx) {
    const selected = new Set();
    el.innerHTML = `<div class="page-head"><div><div class="eyebrow">Saved experiments</div><h1>Experiments</h1><p>Configurations are stored in this browser. Select two or more experiments of the same simulation to compare them.</p></div>
      <div class="row"><button class="btn" id="exp-export" type="button">Export all (JSON)</button><label class="btn" for="exp-import" style="cursor:pointer">Import JSON</label><input id="exp-import" class="sr-only" type="file" accept="application/json,.json"></div></div>
      <div id="exp-list"></div><div id="exp-compare" class="section"></div>`;
    const list = el.querySelector('#exp-list'), cmp = el.querySelector('#exp-compare');

    function summary(e) { return SC.config.sims[e.sim].params.map((p) => (p.type === 'choice' ? `${p.key}=${e.params[p.key]}` : `${p.key}=${+Number(e.params[p.key]).toPrecision(4)}${p.unit ? ' ' + p.unit : ''}`)).join(' · '); }
    function render() {
      const items = SC.experiments.list(); [...selected].forEach((id) => { if (!SC.experiments.get(id)) selected.delete(id); });
      if (!items.length) { list.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${SC.navigation.ICONS.experiments.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg><h3>No saved experiments</h3><p>Open a simulation, adjust its parameters and choose “Save experiment”.</p><a class="btn btn-primary" href="#/workspace/${ctx.workspace.lastSim()}">Open workspace</a></div>`; cmp.innerHTML = ''; return; }
      list.innerHTML = `<div class="exp-list">${items.map((e) => `<div class="exp ${selected.has(e.id) ? 'selected' : ''}"><input class="check" type="checkbox" data-sel="${e.id}" ${selected.has(e.id) ? 'checked' : ''} aria-label="Select ${esc(e.name)} for comparison"><div style="min-width:0"><div class="exp-name">${esc(e.name)}</div><div class="exp-meta">${esc(SC.config.sims[e.sim].name)} · saved ${new Date(e.createdAt).toLocaleString()}</div><div class="exp-params">${esc(summary(e))}</div></div>
        <div class="exp-actions"><button class="btn btn-sm btn-primary" data-act="open" data-id="${e.id}" type="button">Open</button><button class="btn btn-sm" data-act="rename" data-id="${e.id}" type="button">Rename</button><button class="btn btn-sm" data-act="csv" data-id="${e.id}" type="button">CSV</button><button class="btn btn-sm btn-danger" data-act="delete" data-id="${e.id}" type="button" aria-label="Delete ${esc(e.name)}">Delete</button></div></div>`).join('')}</div>`;
      renderCompare();
    }
    function renderCompare() {
      const picks = [...selected].map((id) => SC.experiments.get(id)).filter(Boolean);
      if (picks.length < 2) { cmp.innerHTML = picks.length ? '<p class="panel-meta">Select at least one more experiment to compare.</p>' : ''; return; }
      if (new Set(picks.map((p) => p.sim)).size > 1) { cmp.innerHTML = '<div class="empty"><h3>Mixed simulations selected</h3><p>Comparison needs experiments from the same simulation.</p></div>'; return; }
      const cfg = SC.config.sims[picks[0].sim], fmtP = (p, v) => (p.type === 'choice' ? (p.options.find((o) => o[0] === v) || [, v])[1] : `${+Number(v).toPrecision(5)} ${p.unit}`);
      const models = picks.map((p) => SC.config.buildModel(p.sim, p.params)), metricRows = models[0].metrics(0).map((m, i) => ({ m, i })).filter((r) => r.m.group === 'model');
      const fv = (m) => (m.text ? m.text : m.si ? (({ text, unit }) => `${text} ${unit}`)(fmtSI(m.value, m.unit)) : `${fmt(m.value, m.digits)} ${m.unit}`.trim());
      const row = (label, vals, cls) => `<tr class="${new Set(vals).size > 1 ? 'diff' : ''}"><th scope="row" style="background:none;text-transform:none;letter-spacing:0;font:600 13px var(--font);color:var(--text-2)">${esc(label)}</th>${vals.map((v) => `<td class="num-cell">${esc(v)}</td>`).join('')}</tr>`;
      cmp.innerHTML = `<h2>Comparison · ${esc(cfg.name)}</h2><div class="table-wrap"><table><thead><tr><th scope="col">Quantity</th>${picks.map((p) => `<th scope="col">${esc(p.name)}</th>`).join('')}</tr></thead><tbody>
        <tr><td colspan="${picks.length + 1}" class="panel-meta">INPUT PARAMETERS</td></tr>${cfg.params.map((p) => row(p.label, picks.map((e) => fmtP(p, e.params[p.key])))).join('')}
        <tr><td colspan="${picks.length + 1}" class="panel-meta">MODEL RESULTS</td></tr>${metricRows.map(({ m, i }) => row(m.label, models.map((md) => fv(md.metrics(0)[i])))).join('')}</tbody></table></div><p class="panel-meta" style="margin-top:8px">Highlighted rows differ between the selected experiments.</p>`;
    }
    el.addEventListener('change', (e) => { const c = e.target.closest('[data-sel]'); if (!c) return; c.checked ? selected.add(c.dataset.sel) : selected.delete(c.dataset.sel); render(); el.querySelector(`[data-sel="${c.dataset.sel}"]`)?.focus(); });
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return; const exp = SC.experiments.get(b.dataset.id); if (!exp) return;
      if (b.dataset.act === 'open') ctx.openExperiment(exp.id);
      else if (b.dataset.act === 'rename') { const n = await SC.notify.promptText({ title: 'Rename experiment', label: 'Experiment name', value: exp.name, confirmText: 'Rename' }); if (n) { SC.experiments.rename(exp.id, n); SC.notify.toast('Experiment renamed.', 'success'); } }
      else if (b.dataset.act === 'delete') { if (await SC.notify.confirm({ title: 'Delete experiment?', message: `“${exp.name}” will be permanently removed from this browser.`, confirmText: 'Delete', danger: true })) { SC.experiments.remove(exp.id); selected.delete(exp.id); SC.notify.toast('Experiment deleted.', 'success'); } }
      else if (b.dataset.act === 'csv') { try { const n = SC.exportCSV(exp.sim, exp.params, exp.name); SC.notify.toast(`Exported ${n} samples to CSV.`, 'success'); } catch (err) { SC.notify.toast('CSV export failed: ' + err.message, 'error'); } }
    });
    el.querySelector('#exp-export').addEventListener('click', () => { if (!SC.experiments.list().length) { SC.notify.toast('Nothing to export yet — save an experiment first.', 'warn'); return; } SC.util.downloadText('simucore-experiments.json', SC.experiments.exportJSON(), 'application/json'); SC.notify.toast('Experiments exported as JSON.', 'success'); });
    el.querySelector('#exp-import').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const r = SC.experiments.importJSON(await f.text()); SC.notify.toast(`Imported ${r.added} experiment${r.added === 1 ? '' : 's'}${r.skipped ? `, skipped ${r.skipped}` : ''}.`, r.added ? 'success' : 'warn'); }
      catch (err) { SC.notify.toast('Import failed: ' + err.message, 'error'); } e.target.value = '';
    });
    const unsub = SC.experiments.subscribe(render); render();
    return unsub;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
