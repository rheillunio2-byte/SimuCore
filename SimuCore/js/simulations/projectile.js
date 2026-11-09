/* Projectile motion — ideal point mass, uniform gravity, no drag. Inputs in SI (m, s, rad, m/s²). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.sims = SC.sims || {};
  const { clamp } = SC.util;

  SC.sims.projectile = {
    channels: [
      { key: 'x', label: 'x', unit: 'm' }, { key: 'y', label: 'y', unit: 'm' },
      { key: 'vx', label: 'vx', unit: 'm/s' }, { key: 'vy', label: 'vy', unit: 'm/s' }, { key: 'speed', label: 'speed', unit: 'm/s' },
      { key: 'ke', label: 'kinetic', unit: 'J/kg' }, { key: 'pe', label: 'potential', unit: 'J/kg' }, { key: 'te', label: 'total', unit: 'J/kg' },
    ],
    /** @param {{v0:number, theta:number, h0:number, g:number}} p */
    create({ v0, theta, h0, g }) {
      const vx0 = v0 * Math.cos(theta), vy0 = v0 * Math.sin(theta);
      // y(t)=h0+vy0 t-½gt² = 0  →  t = (vy0+√(vy0²+2 g h0))/g (positive root)
      const T = Math.max(1e-9, (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h0)) / g); // guard: flat launch from y=0 has no flight
      const tApex = vy0 > 0 ? vy0 / g : 0;
      const maxHeight = h0 + (vy0 > 0 ? (vy0 * vy0) / (2 * g) : 0);
      const range = vx0 * T;
      const impactSpeed = Math.sqrt(v0 * v0 + 2 * g * h0); // energy conservation
      const stateAt = (t) => {
        t = clamp(t, 0, T);
        const y = t >= T ? 0 : Math.max(0, h0 + vy0 * t - 0.5 * g * t * t);
        const vy = vy0 - g * t, speed = Math.hypot(vx0, vy);
        const ke = 0.5 * speed * speed, pe = g * y;
        return { t, x: vx0 * t, y, vx: vx0, vy, speed, ke, pe, te: ke + pe };
      };
      return {
        duration: T, timeScale: Math.min(1, T / 2), // very short flights play in slow motion (≥ 2 s)
         stateAt, geometry: { vx0, vy0, T, tApex, maxHeight, range, h0, g },
        sample(n = 240) { return Array.from({ length: n + 1 }, (_, i) => stateAt((T * i) / n)); },
        metrics(t) {
          const s = stateAt(t);
          return [
            { group: 'live', label: 'Horizontal velocity', value: s.vx, unit: 'm/s', digits: 2 },
            { group: 'live', label: 'Vertical velocity', value: s.vy, unit: 'm/s', digits: 2 },
            { group: 'live', label: 'Speed', value: s.speed, unit: 'm/s', digits: 2 },
            { group: 'live', label: 'Height', value: s.y, unit: 'm', digits: 2 },
            { group: 'model', label: 'Flight time', value: T, unit: 's', digits: 3 },
            { group: 'model', label: 'Horizontal range', value: range, unit: 'm', digits: 2 },
            { group: 'model', label: 'Maximum height', value: maxHeight, unit: 'm', digits: 2 },
            { group: 'model', label: 'Impact speed', value: impactSpeed, unit: 'm/s', digits: 2 },
          ];
        },
        summary: { flightTime: T, range, maxHeight, impactSpeed },
      };
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
