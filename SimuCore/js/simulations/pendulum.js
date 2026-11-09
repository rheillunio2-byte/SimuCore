/* Simple pendulum — nonlinear ODE integrated with fixed-step RK4.
 *   θ'' = −(g/L) sin θ − c θ'
 * Inputs in SI (m, rad, m/s², 1/s, kg). The small-angle period 2π√(L/g) is reported separately
 * from the large-amplitude undamped period, which is exact via the AGM: T = T₀ / AGM(1, cos(θ₀/2)). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.sims = SC.sims || {};
  const { clamp, agm } = SC.util;

  SC.sims.pendulum = {
    channels: [
      { key: 'theta', label: 'theta', unit: 'rad' }, { key: 'omega', label: 'omega', unit: 'rad/s' },
      { key: 'ke', label: 'kinetic', unit: 'J' }, { key: 'pe', label: 'potential', unit: 'J' }, { key: 'te', label: 'total', unit: 'J' },
    ],
    /** @param {{L:number, theta0:number, g:number, c:number, m:number}} p */
    create({ L, theta0, g, c, m }) {
      const w0 = Math.sqrt(g / L), T0 = (2 * Math.PI) / w0;           // small-angle approximation
      const Tlarge = T0 / agm(1, Math.cos(theta0 / 2));                // exact, undamped, any amplitude
      // Run length: ~8 periods, cut short when damping has removed 99% of the amplitude (e^{-ct/2} = 0.01).
      const decay = c > 1e-3 ? (2 * Math.log(100)) / c : Infinity;
      const duration = clamp(Math.min(8 * Tlarge, Math.max(3 * Tlarge, decay)), 2, 60);
      const dt = Math.min(0.002, Tlarge / 400), n = Math.ceil(duration / dt), h = duration / n;
      const th = new Float64Array(n + 1), om = new Float64Array(n + 1);
      let y = [theta0, 0];
      th[0] = theta0;
      const f = (_t, s) => [s[1], -(g / L) * Math.sin(s[0]) - c * s[1]];
      for (let i = 1; i <= n; i++) { y = SC.rk4Step(f, 0, y, h); th[i] = y[0]; om[i] = y[1]; }

      const energy = (a, w) => { const ke = 0.5 * m * L * L * w * w, pe = m * g * L * (1 - Math.cos(a)); return { ke, pe, te: ke + pe }; };
      const stateAt = (t) => {
        t = clamp(t, 0, duration);
        const u = t / h, i = Math.min(n - 1, Math.floor(u)), f1 = u - i;
        const theta = th[i] + (th[i + 1] - th[i]) * f1, omega = om[i] + (om[i + 1] - om[i]) * f1;
        return { t, theta, omega, ...energy(theta, omega) };
      };
      // Measured period: spacing of successive downward zero crossings of θ in the simulated data.
      let measuredPeriod = NaN; const cross = [];
      for (let i = 0; i < n && cross.length < 2; i++) if (th[i] > 0 && th[i + 1] <= 0) cross.push((i + th[i] / (th[i] - th[i + 1])) * h);
      if (cross.length === 2) measuredPeriod = cross[1] - cross[0];
      const E0 = energy(theta0, 0).te;
      return {
        duration, timeScale: 1, stateAt, geometry: { L, m, theta0 },
        sample(k = 300) { return Array.from({ length: k + 1 }, (_, i) => stateAt((duration * i) / k)); },
        metrics(t) {
          const s = stateAt(t);
          return [
            { group: 'live', label: 'Angular position', value: (s.theta * 180) / Math.PI, unit: '°', digits: 2 },
            { group: 'live', label: 'Angular velocity', value: s.omega, unit: 'rad/s', digits: 3 },
            { group: 'live', label: 'Kinetic energy', value: s.ke, unit: 'J', digits: 4 },
            { group: 'live', label: 'Total energy', value: s.te, unit: 'J', digits: 4 },
            { group: 'model', label: 'Small-angle period', value: T0, unit: 's', digits: 3, note: '2π√(L/g), approximation' },
            { group: 'model', label: 'Large-amplitude period', value: Tlarge, unit: 's', digits: 3, note: 'exact, undamped' },
            { group: 'model', label: 'Measured period', value: measuredPeriod, unit: 's', digits: 3, note: 'from simulated motion' },
            { group: 'model', label: 'Energy remaining', value: E0 > 0 ? (100 * s.te) / E0 : NaN, unit: '%', digits: 1 },
          ];
        },
        summary: { T0, Tlarge, measuredPeriod, E0 },
      };
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
