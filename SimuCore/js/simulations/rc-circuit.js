/* RC circuit — series resistor + capacitor driven by an ideal DC source (or shorted to discharge).
 *   Vc(t) = V∞ + (V0 − V∞) e^(−t/RC),  i(t) = (V∞ − Vc)/R   (positive = charging the capacitor)
 * V∞ = Vs when charging, 0 when discharging. Inputs in SI (V, Ω, F). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.sims = SC.sims || {};
  const { clamp } = SC.util;

  SC.sims.rc = {
    channels: [
      { key: 'vc', label: 'capacitor_voltage', unit: 'V' }, { key: 'i', label: 'current', unit: 'A' },
      { key: 'q', label: 'charge', unit: 'C' }, { key: 'energy', label: 'stored_energy', unit: 'J' }, { key: 'pr', label: 'resistor_power', unit: 'W' },
    ],
    /** @param {{mode:'charge'|'discharge', Vs:number, R:number, C:number, V0:number}} p */
    create({ mode, Vs, R, C, V0 }) {
      const vInf = mode === 'discharge' ? 0 : Vs, tau = R * C;
      const duration = clamp(5 * tau, 1e-9, 1e6); // 5τ ≈ 99.3 % of the transition
      const timeScale = duration / 8;               // play the whole transient in ~8 s at 1× (τ can span µs…s)
      const stateAt = (t) => {
        t = clamp(t, 0, duration);
        const vc = vInf + (V0 - vInf) * Math.exp(-t / tau), i = (vInf - vc) / R;
        return { t, vc, i, q: C * vc, energy: 0.5 * C * vc * vc, pr: i * i * R, vInf, tau };
      };
      return {
        duration, timeScale, stateAt, geometry: { vInf, V0, mode, tau, Vs },
        sample(n = 300) { return Array.from({ length: n + 1 }, (_, i) => stateAt((duration * i) / n)); },
        metrics(t) {
          const s = stateAt(t);
          return [
            { group: 'live', label: 'Capacitor voltage', value: s.vc, unit: 'V', si: true },
            { group: 'live', label: 'Current', value: s.i, unit: 'A', si: true },
            { group: 'live', label: 'Stored energy', value: s.energy, unit: 'J', si: true },
            { group: 'live', label: 'Resistor power', value: s.pr, unit: 'W', si: true },
            { group: 'model', label: 'Time constant τ = RC', value: tau, unit: 's', si: true },
            { group: 'model', label: 'Final voltage', value: vInf, unit: 'V', si: true },
            { group: 'model', label: 'Initial current', value: (vInf - V0) / R, unit: 'A', si: true },
            { group: 'model', label: 'Time to 99 % (≈ 4.6τ)', value: Math.log(100) * tau, unit: 's', si: true },
          ];
        },
        summary: { tau, vInf, initialCurrent: (vInf - V0) / R },
      };
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
