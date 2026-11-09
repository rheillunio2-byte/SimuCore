/* SimuCore — shared utilities. Pure helpers, no DOM dependency (except download/escape). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const finiteOr = (v, fallback = 0) => (isNum(v) ? v : fallback);

  /** Fixed-point formatting that never prints NaN/Infinity. */
  function fmt(v, digits = 2) {
    if (!isNum(v)) return '—';
    if (Object.is(v, -0) || Math.abs(v) < 0.5 * Math.pow(10, -digits)) v = 0;
    return v.toFixed(digits);
  }

  const PREFIXES = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];

  /** Choose an engineering prefix for a magnitude. Returns {factor, prefix}. */
  function siScale(magnitude) {
    const m = Math.abs(magnitude);
    if (!isNum(m) || m === 0) return { factor: 1, prefix: '' };
    for (const [factor, prefix] of PREFIXES) if (m >= factor * 0.9995) return { factor, prefix };
    return { factor: 1e-12, prefix: 'p' };
  }

  /** Format a value in SI units with an automatic prefix, e.g. 0.0123 A -> "12.30 mA". */
  function fmtSI(v, unit, sig = 3) {
    if (!isNum(v)) return { text: '—', unit };
    const { factor, prefix } = siScale(v);
    const scaled = v / factor;
    const digits = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(scaled) || 1)));
    return { text: fmt(scaled, Math.min(digits, 4)), unit: prefix + unit };
  }

  /** "Nice" axis ticks covering [min,max]. */
  function niceTicks(min, max, target = 5) {
    if (!isNum(min) || !isNum(max)) return { ticks: [0, 1], min: 0, max: 1 };
    if (min === max) { const d = Math.abs(min) || 1; min -= d; max += d; }
    const span = max - min, raw = span / Math.max(1, target);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return { ticks, min: lo, max: hi, step };
  }

  /** Serialize rows (array of arrays) to RFC-4180-ish CSV. */
  function toCSV(rows) {
    return rows.map((r) => r.map((c) => {
      const s = String(c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n') + '\n';
  }

  const uid = () => 'exp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** Arithmetic–geometric mean, used for the exact large-amplitude pendulum period. */
  function agm(a, b) {
    for (let i = 0; i < 40 && Math.abs(a - b) > 1e-15 * a; i++) { const t = (a + b) / 2; b = Math.sqrt(a * b); a = t; }
    return (a + b) / 2;
  }

  function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  SC.util = { clamp, isNum, finiteOr, fmt, fmtSI, siScale, niceTicks, toCSV, uid, escapeHtml, agm, downloadText };
  SC.sims = SC.sims || {};
})(typeof globalThis !== 'undefined' ? globalThis : this);
