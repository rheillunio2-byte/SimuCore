// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
['core/utilities', 'core/engine', 'simulations/projectile', 'simulations/pendulum', 'simulations/spring', 'simulations/rc-circuit', 'data/simulation-config'].forEach((f) => require('../js/' + f + '.js'));
const SC = globalThis.SimuCore, { sims } = SC;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b}, got ${a} (tol ${tol})`);
const allFinite = (rows) => rows.every((r) => Object.values(r).every((v) => Number.isFinite(v)));

test('projectile: closed-form checks', () => {
  const m = sims.projectile.create({ v0: 20, theta: Math.PI / 6, h0: 0, g: 9.81 });
  near(m.summary.flightTime, (2 * 20 * 0.5) / 9.81, 1e-12, 'T');
  near(m.summary.range, (400 * Math.sin(Math.PI / 3)) / 9.81, 1e-9, 'R');
  near(m.summary.maxHeight, (10 * 10) / (2 * 9.81), 1e-12, 'H');
  near(m.stateAt(m.duration).y, 0, 1e-9, 'lands at y=0');
});
test('projectile: h0 = 0, vertical launch and raised launch', () => {
  const up = sims.projectile.create({ v0: 10, theta: Math.PI / 2, h0: 0, g: 10 });
  near(up.summary.flightTime, 2, 1e-12); near(up.summary.maxHeight, 5, 1e-12); near(up.summary.range, 0, 1e-9);
  const hi = sims.projectile.create({ v0: 15, theta: 0, h0: 20, g: 10 });
  near(hi.summary.flightTime, 2, 1e-12); near(hi.summary.range, 30, 1e-9); near(hi.summary.impactSpeed, Math.hypot(15, 20), 1e-9);
});
test('projectile: energy per kg conserved', () => {
  const m = sims.projectile.create({ v0: 30, theta: 1.0, h0: 5, g: 9.81 });
  const e0 = m.stateAt(0).te; m.sample(100).forEach((s) => near(s.te, e0, 1e-8, 'E'));
});
test('pendulum: small angle matches θ0 cos(ωt) and T0', () => {
  const p = { L: 1, theta0: 0.01, g: 9.81, c: 0, m: 1 }, m = sims.pendulum.create(p), w = Math.sqrt(9.81);
  [0.5, 1, 2.5].forEach((t) => near(m.stateAt(t).theta, 0.01 * Math.cos(w * t), 2e-6, 't=' + t));
  near(m.summary.measuredPeriod, m.summary.T0, 2e-3, 'period');
});
test('pendulum: large amplitude period matches exact AGM period', () => {
  const m = sims.pendulum.create({ L: 1, theta0: (150 * Math.PI) / 180, g: 9.81, c: 0, m: 1 });
  near(m.summary.measuredPeriod, m.summary.Tlarge, 2e-3 * m.summary.Tlarge, 'period');
  assert.ok(m.summary.Tlarge > 1.75 * m.summary.T0, 'small-angle formula must be flagged as inaccurate');
});
test('pendulum: undamped energy conserved; damped energy decreases monotonically', () => {
  const m = sims.pendulum.create({ L: 2, theta0: 2, g: 9.81, c: 0, m: 1.5 }), e0 = m.stateAt(0).te;
  m.sample(200).forEach((s) => near(s.te, e0, 1e-5 * e0));
  const d = sims.pendulum.create({ L: 1, theta0: 1, g: 9.81, c: 0.3, m: 1 }).sample(200);
  for (let i = 1; i < d.length; i++) assert.ok(d[i].te <= d[i - 1].te + 1e-6);
});
test('spring: closed form agrees with independent RK4 for all regimes', () => {
  const base = { m: 2, k: 20, x0: 0.7, v0: 0.3 }, cc = 2 * Math.sqrt(40);
  for (const c of [0, 2, cc * 0.999999, cc, 3 * cc]) {
    const p = { ...base, c }, model = sims.spring.create(p);
    let y = [p.x0, p.v0]; const h = 1e-3, f = (_t, s) => [s[1], -(p.k / p.m) * s[0] - (p.c / p.m) * s[1]];
    for (let i = 0; i < 1500; i++) y = SC.rk4Step(f, 0, y, h);
    near(model.stateAt(1.5).x, y[0], 1e-7, 'x c=' + c); near(model.stateAt(1.5).v, y[1], 1e-7, 'v c=' + c);
  }
});
test('spring: regime classification, continuity near critical damping', () => {
  const cc = 2 * Math.sqrt(20 * 2), mk = (c) => sims.spring.create({ m: 2, k: 20, c, x0: 1, v0: 0 });
  assert.equal(mk(0).summary.regime, 'Undamped'); assert.equal(mk(2).summary.regime, 'Underdamped');
  assert.equal(mk(cc).summary.regime, 'Critically damped'); assert.equal(mk(30).summary.regime, 'Overdamped');
  [1e-4, 1e-7].forEach((e) => near(mk(cc * (1 + e)).stateAt(0.5).x, mk(cc).stateAt(0.5).x, 1e-3, 'continuity'));
  near(mk(cc * (1 + 1e-9)).stateAt(0.5).x, mk(cc).stateAt(0.5).x, 1e-6, 'continuity at tolerance edge');
  const over = mk(30).sample(200); assert.ok(over.every((s) => s.x >= -1e-12), 'overdamped from rest never crosses zero');
});
test('spring: undamped energy conserved', () => {
  const m = sims.spring.create({ m: 1, k: 10, c: 0, x0: 1, v0: 0 }); m.sample(100).forEach((s) => near(s.te, 5, 1e-9));
});
test('rc: charging and discharging match analytic values', () => {
  const ch = sims.rc.create({ mode: 'charge', Vs: 12, R: 1e4, C: 1e-4, V0: 0 });
  near(ch.stateAt(1).vc, 12 * (1 - Math.exp(-1)), 1e-12, '63.2%'); near(ch.stateAt(0).i, 1.2e-3, 1e-15, 'I0');
  near(ch.summary.tau, 1, 1e-12);
  const dis = sims.rc.create({ mode: 'discharge', Vs: 12, R: 1e4, C: 1e-4, V0: 8 });
  near(dis.stateAt(1).vc, 8 * Math.exp(-1), 1e-12); assert.ok(dis.stateAt(0.5).i < 0, 'discharge current is negative');
});
test('rc: energy balance — resistor dissipation equals source work minus stored energy change', () => {
  const m = sims.rc.create({ mode: 'charge', Vs: 10, R: 1e3, C: 1e-3, V0: 2 }), s = m.sample(4000);
  let diss = 0, work = 0;
  for (let i = 1; i < s.length; i++) { const dt = s[i].t - s[i - 1].t; diss += 0.5 * (s[i].pr + s[i - 1].pr) * dt; work += 0.5 * (s[i].i + s[i - 1].i) * 10 * dt; }
  near(work - diss, s[s.length - 1].energy - s[0].energy, 1e-6, 'energy balance');
});
test('config: every simulation stays finite across the whole parameter box corners', () => {
  for (const id of SC.config.order) {
    const ps = SC.config.sims[id].params.filter((p) => p.type !== 'choice');
    for (let mask = 0; mask < Math.min(1 << ps.length, 64); mask++) {
      const v = {}; ps.forEach((p, i) => { v[p.key] = mask & (1 << i) ? p.max : p.min; });
      for (const mode of id === 'rc' ? ['charge', 'discharge'] : [undefined]) {
        if (mode) v.mode = mode;
        const m = SC.config.buildModel(id, v);
        assert.ok(Number.isFinite(m.duration) && m.duration > 0 && m.duration <= 1e6, `${id} duration ${m.duration}`);
        assert.ok(allFinite(m.sample(60)), `${id} non-finite sample for ${JSON.stringify(v)}`);
        m.metrics(m.duration / 2).forEach((x) => assert.ok(x.text || Number.isFinite(x.value) || Number.isNaN(x.value)));
      }
    }
  }
});
test('config: normalize rejects NaN / out of range input', () => {
  const n = SC.config.normalize('projectile', { v0: NaN, theta: 1e9, h0: -5, g: 'abc' });
  assert.deepEqual(n, { v0: 25, theta: 90, h0: 0, g: 9.81 });
});
test('util: fmt never prints NaN/Infinity; SI prefixes; CSV quoting', () => {
  const u = SC.util; assert.equal(u.fmt(NaN), '—'); assert.equal(u.fmt(Infinity), '—'); assert.equal(u.fmt(-0.0001, 2), '0.00');
  assert.deepEqual(u.fmtSI(0.0123, 'A'), { text: '12.3', unit: 'mA' }); assert.equal(u.fmtSI(2.5e-6, 'F').unit, 'µF');
  assert.equal(u.toCSV([['a,b', 'c"d']]), '"a,b","c""d"\n');
});
