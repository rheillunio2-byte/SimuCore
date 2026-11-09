/* SimuCore — declarative description of every simulation: parameters, charts, documentation.
 * Parameter keys are the SI names expected by js/simulations/*.js; `si` converts the displayed unit to SI. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  const D = Math.PI / 180;
  const stroke = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  const config = {
    projectile: {
      id: 'projectile', name: 'Projectile Motion', short: 'Projectile', category: 'Kinematics · 2D',
      blurb: 'Ballistic flight under uniform gravity. Explore launch angle, speed and height.',
      icon: `<svg viewBox="0 0 24 24" ${stroke}><path d="M3 19C7 5 15 5 21 19"/><circle cx="12" cy="7.2" r="1.6" fill="currentColor"/></svg>`,
      viewLabel: 'X–Y PLANE · EQUAL AXIS SCALE', model: 'Ideal point mass, no air resistance',
      params: [
        { key: 'v0', label: 'Initial velocity', unit: 'm/s', min: 1, max: 100, step: 0.5, def: 25, si: 1 },
        { key: 'theta', label: 'Launch angle', unit: '°', min: 1, max: 90, step: 1, def: 45, si: D },
        { key: 'h0', label: 'Initial height', unit: 'm', min: 0, max: 100, step: 0.5, def: 2, si: 1 },
        { key: 'g', label: 'Gravity', unit: 'm/s²', min: 1, max: 25, step: 0.01, def: 9.81, si: 1, decimals: 2,
          presets: [['Earth', 9.81], ['Moon', 1.62], ['Mars', 3.71], ['Jupiter', 24.79]] },
      ],
      charts: [
        { id: 'position', label: 'Position', y: { label: 'Position', unit: 'm' }, series: [{ key: 'x', label: 'x (horizontal)', color: '#5b9bff' }, { key: 'y', label: 'y (height)', color: '#35d3e3' }] },
        { id: 'velocity', label: 'Velocity', y: { label: 'Velocity', unit: 'm/s' }, series: [{ key: 'vx', label: 'vₓ', color: '#5b9bff' }, { key: 'vy', label: 'v_y', color: '#35d3e3' }, { key: 'speed', label: 'speed', color: '#a99bff', dash: [5, 4] }] },
        { id: 'energy', label: 'Energy', y: { label: 'Specific energy', unit: 'J/kg' }, series: [{ key: 'ke', label: 'kinetic', color: '#35d3e3' }, { key: 'pe', label: 'potential', color: '#a99bff' }, { key: 'te', label: 'total', color: '#eaf2ff', dash: [5, 4] }] },
      ],
      docs: {
        equations: ['x(t) = v₀ cos θ · t', 'y(t) = h₀ + v₀ sin θ · t − ½ g t²', 't_flight = ( v₀ sin θ + √( (v₀ sin θ)² + 2 g h₀ ) ) / g', 'y_max = h₀ + (v₀ sin θ)² / 2g   (when v₀ sin θ > 0)', 'R = v₀ cos θ · t_flight'],
        assumptions: ['Point mass; no air drag, lift or spin.', 'Uniform gravitational field, flat ground at y = 0.', 'Flight ends at first ground contact; no bounce.', 'Energy is shown per kilogram, so mass does not enter the model.'],
        notes: 'Range is maximal at 45° only when launching from ground level (h₀ = 0). From a raised start the optimal angle is lower.',
      },
    },
    pendulum: {
      id: 'pendulum', name: 'Simple Pendulum', short: 'Pendulum', category: 'Oscillation · Nonlinear dynamics',
      blurb: 'Damped nonlinear pendulum integrated numerically, compared with the small-angle period.',
      icon: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 3v1M12 4l5.5 12"/><circle cx="18" cy="18" r="2.6" fill="currentColor"/><path d="M8 3h8"/></svg>`,
      viewLabel: 'ANGULAR DISPLACEMENT · RK4', model: 'Point mass, massless rod, viscous angular damping',
      params: [
        { key: 'L', label: 'Pendulum length', unit: 'm', min: 0.1, max: 5, step: 0.05, def: 1.5, si: 1, decimals: 2 },
        { key: 'theta0', label: 'Initial angular displacement', unit: '°', min: 1, max: 175, step: 1, def: 35, si: D },
        { key: 'g', label: 'Gravity', unit: 'm/s²', min: 1, max: 25, step: 0.01, def: 9.81, si: 1, decimals: 2, presets: [['Earth', 9.81], ['Moon', 1.62], ['Mars', 3.71]] },
        { key: 'c', label: 'Damping coefficient', unit: '1/s', min: 0, max: 2, step: 0.01, def: 0.05, si: 1, decimals: 2 },
        { key: 'm', label: 'Bob mass', unit: 'kg', min: 0.1, max: 5, step: 0.1, def: 1, si: 1, decimals: 1 },
      ],
      charts: [
        { id: 'position', label: 'Position', y: { label: 'Angle θ', unit: 'rad' }, series: [{ key: 'theta', label: 'θ(t)', color: '#5b9bff' }] },
        { id: 'velocity', label: 'Velocity', y: { label: 'Angular velocity ω', unit: 'rad/s' }, series: [{ key: 'omega', label: 'ω(t)', color: '#35d3e3' }] },
        { id: 'energy', label: 'Energy', y: { label: 'Energy', unit: 'J' }, series: [{ key: 'ke', label: 'kinetic', color: '#35d3e3' }, { key: 'pe', label: 'potential', color: '#a99bff' }, { key: 'te', label: 'total', color: '#eaf2ff', dash: [5, 4] }] },
      ],
      docs: {
        equations: ['θ″ + c θ′ + (g/L) sin θ = 0', 'T₀ = 2π √(L/g)   (small-angle approximation)', 'T = T₀ / AGM(1, cos(θ₀/2))   (exact, undamped, any amplitude)', 'E = ½ m L² ω² + m g L (1 − cos θ)'],
        assumptions: ['The simulated motion solves the full sin θ equation with RK4 (step ≤ 2 ms); it is not the linearised model.', 'T₀ is only accurate for small angles; the gap to the measured period grows with amplitude.', 'Damping is linear in angular velocity; its coefficient c has units 1/s.', 'Energy zero is at the lowest point of the swing. Runs are limited to 60 s.'],
        notes: 'At 5° the three period values agree closely. At 150° the small-angle value underestimates the true period by about 43 % (the real period is ≈ 1.76× larger).',
      },
    },
    spring: {
      id: 'spring', name: 'Spring–Mass System', short: 'Spring–mass', category: 'Vibration · Harmonic motion',
      blurb: 'Free vibration of a damped mass on a linear spring: under-, critically and over-damped.',
      icon: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 2v3l-4 2 8 3-8 3 8 3-4 2v2"/><rect x="8" y="19" width="8" height="3" rx="1"/></svg>`,
      viewLabel: 'DISPLACEMENT FROM EQUILIBRIUM', model: 'Linear spring, viscous damper, no forcing',
      params: [
        { key: 'm', label: 'Mass', unit: 'kg', min: 0.1, max: 20, step: 0.1, def: 2, si: 1, decimals: 1 },
        { key: 'k', label: 'Spring stiffness', unit: 'N/m', min: 1, max: 200, step: 1, def: 20, si: 1, decimals: 0 },
        { key: 'c', label: 'Damping coefficient', unit: 'N·s/m', min: 0, max: 60, step: 0.1, def: 2, si: 1, decimals: 2, special: 'critical' },
        { key: 'x0', label: 'Initial displacement', unit: 'm', min: -1.5, max: 1.5, step: 0.05, def: 0.7, si: 1, decimals: 2 },
        { key: 'v0', label: 'Initial velocity', unit: 'm/s', min: -5, max: 5, step: 0.1, def: 0, si: 1, decimals: 1 },
      ],
      charts: [
        { id: 'position', label: 'Position', y: { label: 'Displacement x', unit: 'm' }, series: [{ key: 'x', label: 'x(t)', color: '#5b9bff' }] },
        { id: 'velocity', label: 'Velocity', y: { label: 'Velocity v', unit: 'm/s' }, series: [{ key: 'v', label: 'v(t)', color: '#35d3e3' }] },
        { id: 'energy', label: 'Energy', y: { label: 'Energy', unit: 'J' }, series: [{ key: 'ke', label: 'kinetic', color: '#35d3e3' }, { key: 'pe', label: 'elastic', color: '#a99bff' }, { key: 'te', label: 'total', color: '#eaf2ff', dash: [5, 4] }] },
      ],
      docs: {
        equations: ['m x″ + c x′ + k x = 0', 'ωₙ = √(k/m),   Tₙ = 2π/ωₙ,   ζ = c / (2√(k m))', 'ζ < 1: x = e^(−ζωₙt)( x₀ cos ω_d t + B sin ω_d t ),  ω_d = ωₙ√(1−ζ²)', 'ζ = 1: x = e^(−ωₙt)( x₀ + (v₀ + ωₙx₀) t )', 'ζ > 1: x = C₁e^(r₁t) + C₂e^(r₂t),  r = −ζωₙ ± ωₙ√(ζ²−1)'],
        assumptions: ['Horizontal or gravity-compensated: displacement is measured from static equilibrium.', 'Linear spring (Hooke’s law) and linear viscous damping.', 'The closed-form solution is used for the display and verified against an RK4 integration in the test suite.', 'Runs end when the envelope has decayed to 1 % (max 60 s).'],
        notes: 'Use “Set critical damping” to find the fastest non-oscillatory return to equilibrium. Natural frequency is the undamped value and does not include c.',
      },
    },
    rc: {
      id: 'rc', name: 'RC Circuit', short: 'RC circuit', category: 'Electrical · First-order transient',
      blurb: 'Charge or discharge a capacitor through a resistor and read the exponential response.',
      icon: `<svg viewBox="0 0 24 24" ${stroke}><path d="M2 12h4l1.5-4 3 8 1.5-4h2M16 6v12M19 6v12M19 12h3"/></svg>`,
      viewLabel: 'SERIES RC CIRCUIT · LIVE CHARGE FLOW', model: 'Ideal DC source, ideal resistor and capacitor',
      params: [
        { key: 'mode', label: 'Mode', type: 'choice', options: [['charge', 'Charging'], ['discharge', 'Discharging']], def: 'charge' },
        { key: 'Vs', label: 'Source voltage', unit: 'V', min: 0.5, max: 24, step: 0.5, def: 12, si: 1, decimals: 1 },
        { key: 'R', label: 'Resistance', unit: 'kΩ', min: 0.1, max: 1000, step: 0.1, def: 10, si: 1e3, log: true, decimals: 1 },
        { key: 'C', label: 'Capacitance', unit: 'µF', min: 0.1, max: 1000, step: 0.1, def: 100, si: 1e-6, log: true, decimals: 1 },
        { key: 'V0', label: 'Initial capacitor voltage', unit: 'V', min: 0, max: 24, step: 0.5, def: 0, si: 1, decimals: 1 },
      ],
      charts: [
        { id: 'voltage', label: 'Voltage', y: { label: 'Capacitor voltage', unit: 'V', si: true }, series: [{ key: 'vc', label: 'V_C(t)', color: '#5b9bff' }] },
        { id: 'current', label: 'Current', y: { label: 'Current', unit: 'A', si: true }, series: [{ key: 'i', label: 'i(t)', color: '#35d3e3' }] },
        { id: 'energy', label: 'Energy', y: { label: 'Stored energy', unit: 'J', si: true }, series: [{ key: 'energy', label: '½CV²', color: '#a99bff' }] },
      ],
      docs: {
        equations: ['V_C(t) = V∞ + (V₀ − V∞) e^(−t/τ),   τ = R C', 'i(t) = (V∞ − V_C) / R   (positive while charging)', 'E_C = ½ C V_C²,   P_R = i² R', 'V∞ = V_s (charging)  ·  V∞ = 0 (discharging)'],
        assumptions: ['Ideal resistor and capacitor: no leakage, ESR or inductance.', 'Instantaneous ideal DC source; no switching dynamics.', 'The run covers 5τ (about 99.3 % of the transition). Playback is time-scaled so τ from µs to minutes plays in about 8 s at 1×.', 'Inputs use kΩ and µF; the model converts to Ω and F before computing.'],
        notes: 'After one time constant the voltage has covered 63.2 % of the way to its final value. Discharging ignores the source voltage.',
      },
    },
  };

  const order = ['projectile', 'pendulum', 'spring', 'rc'];

  /** Clamp every parameter into range and replace non-finite values with defaults. */
  function normalize(id, values) {
    const out = {};
    for (const p of config[id].params) {
      let v = values ? values[p.key] : undefined;
      if (p.type === 'choice') out[p.key] = p.options.some((o) => o[0] === v) ? v : p.def;
      else { v = Number(v); out[p.key] = Number.isFinite(v) ? Math.min(p.max, Math.max(p.min, v)) : p.def; }
    }
    return out;
  }
  const defaults = (id) => normalize(id, null);
  /** Convert displayed values to the SI values consumed by the models. */
  function toSI(id, values) {
    const v = normalize(id, values), out = {};
    for (const p of config[id].params) out[p.key] = p.type === 'choice' ? v[p.key] : v[p.key] * p.si;
    return out;
  }
  function buildModel(id, values) { return SC.sims[id].create(toSI(id, values)); }

  SC.config = { sims: config, order, normalize, defaults, toSI, buildModel };
})(typeof globalThis !== 'undefined' ? globalThis : this);
