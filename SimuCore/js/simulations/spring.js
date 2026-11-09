/* Spring–mass–damper — free vibration  m x'' + c x' + k x = 0.
 * Evaluated from the closed-form solution (exact for all damping regimes; no integration drift).
 * tests/ cross-checks it against an independent RK4 integration. Inputs in SI (kg, N/m, N·s/m, m, m/s). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.sims = SC.sims || {};
  const { clamp } = SC.util;
  const CRIT_TOL = 1e-6; // |ζ−1| below this uses the critically-damped formula (avoids 0/0 in the overdamped form)

  SC.sims.spring = {
    channels: [
      { key: 'x', label: 'displacement', unit: 'm' }, { key: 'v', label: 'velocity', unit: 'm/s' },
      { key: 'ke', label: 'kinetic', unit: 'J' }, { key: 'pe', label: 'potential', unit: 'J' }, { key: 'te', label: 'total', unit: 'J' },
    ],
    /** @param {{m:number,k:number,c:number,x0:number,v0:number}} p */
    create({ m, k, c, x0, v0 }) {
      const wn = Math.sqrt(k / m), cCrit = 2 * Math.sqrt(k * m), zeta = c / cCrit;
      const regime = Math.abs(zeta - 1) <= CRIT_TOL ? 'Critically damped' : zeta < 1 ? (zeta === 0 ? 'Undamped' : 'Underdamped') : 'Overdamped';
      const Tn = (2 * Math.PI) / wn;
      let solve, slowRate;
      if (regime === 'Critically damped') {
        const B = v0 + wn * x0; slowRate = wn;
        solve = (t) => { const e = Math.exp(-wn * t); return [e * (x0 + B * t), e * (v0 - wn * B * t)]; };
      } else if (zeta < 1) {
        const sigma = zeta * wn, wd = wn * Math.sqrt(1 - zeta * zeta), B = (v0 + sigma * x0) / wd; slowRate = sigma;
        solve = (t) => {
          const e = Math.exp(-sigma * t), co = Math.cos(wd * t), si = Math.sin(wd * t);
          return [e * (x0 * co + B * si), e * ((-sigma * x0 + B * wd) * co + (-sigma * B - x0 * wd) * si)];
        };
      } else {
        const s = wn * Math.sqrt(zeta * zeta - 1), r1 = -zeta * wn + s, r2 = -zeta * wn - s;
        const C1 = (v0 - r2 * x0) / (r1 - r2), C2 = x0 - C1; slowRate = -r1;
        solve = (t) => { const e1 = Math.exp(r1 * t), e2 = Math.exp(r2 * t); return [C1 * e1 + C2 * e2, C1 * r1 * e1 + C2 * r2 * e2]; };
      }
      // Run length: 1% envelope decay (ln100/rate), at least 3 periods, at most 60 s; undamped = 8 periods.
      const duration = clamp(zeta === 0 ? 8 * Tn : Math.max(Math.min(Math.log(100) / slowRate, 60), zeta < 1 ? 3 * Tn : 0), 2, 60);
      const stateAt = (t) => {
        t = clamp(t, 0, duration);
        const [x, v] = solve(t), ke = 0.5 * m * v * v, pe = 0.5 * k * x * x;
        return { t, x, v, ke, pe, te: ke + pe };
      };
      const wd = zeta < 1 ? wn * Math.sqrt(1 - zeta * zeta) : NaN;
      return {
        duration, timeScale: 1, stateAt, geometry: { m, x0, v0, zeta },
        sample(n = 300) { return Array.from({ length: n + 1 }, (_, i) => stateAt((duration * i) / n)); },
        metrics(t) {
          const s = stateAt(t);
          return [
            { group: 'live', label: 'Displacement', value: s.x, unit: 'm', digits: 3 },
            { group: 'live', label: 'Velocity', value: s.v, unit: 'm/s', digits: 3 },
            { group: 'live', label: 'Kinetic energy', value: s.ke, unit: 'J', digits: 4 },
            { group: 'live', label: 'Total energy', value: s.te, unit: 'J', digits: 4 },
            { group: 'model', label: 'Natural frequency', value: wn / (2 * Math.PI), unit: 'Hz', digits: 3 },
            { group: 'model', label: 'Natural period', value: Tn, unit: 's', digits: 3 },
            { group: 'model', label: 'Damping ratio ζ', value: zeta, unit: '', digits: 3 },
            { group: 'model', label: 'Response', text: regime, unit: '', note: Number.isFinite(wd) ? 'damped ω_d = ' + wd.toFixed(3) + ' rad/s' : 'critical c = ' + cCrit.toFixed(2) + ' N·s/m' },
          ];
        },
        summary: { wn, zeta, cCrit, Tn, regime, wd },
      };
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
