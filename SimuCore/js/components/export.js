/* SimuCore — CSV export of a simulation's sampled response (metadata in '#' comment lines). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  SC.exportCSV = function (simId, values, label) {
    const cfg = SC.config.sims[simId], v = SC.config.normalize(simId, values), model = SC.config.buildModel(simId, v);
    const rows = model.sample(500), ch = SC.sims[simId].channels, num = (x) => (Number.isFinite(x) ? Number(x.toPrecision(10)) : '');
    const head = [['# SimuCore export'], ['# simulation', cfg.name], ...(label ? [['# experiment', label]] : []), ['# exported', new Date().toISOString()],
      ...cfg.params.map((p) => ['# ' + p.key + (p.unit ? ' [' + p.unit + ']' : ''), v[p.key]]), ['# model', cfg.model], ['time [s]', ...ch.map((c) => `${c.label} [${c.unit}]`)]];
    const body = rows.map((r) => [num(r.t), ...ch.map((c) => num(r[c.key]))]);
    SC.util.downloadText(`simucore-${simId}-${new Date().toISOString().slice(0, 10)}.csv`, SC.util.toCSV([...head, ...body]));
    return rows.length;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
