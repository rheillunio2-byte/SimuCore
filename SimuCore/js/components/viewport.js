/* SimuCore — simulation viewport renderers (canvas). Pure drawing: all physics comes from the model. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  const { niceTicks, fmtSI, fmt } = SC.util;
  const MONO = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const C = { blue: '#5b9bff', cyan: '#35d3e3', violet: '#a99bff', text: '#eaf2ff', muted: '#93a1bd', faint: '#6c7a97', grid: 'rgba(148,163,205,.10)', axis: 'rgba(170,190,230,.45)', warn: '#f2b96a' };
  const amplitudeCache = new WeakMap();

  function arrow(ctx, x1, y1, x2, y2, color, label) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < 4) return;
    const a = Math.atan2(dy, dx); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 8 * Math.cos(a - 0.4), y2 - 8 * Math.sin(a - 0.4)); ctx.lineTo(x2 - 8 * Math.cos(a + 0.4), y2 - 8 * Math.sin(a + 0.4)); ctx.closePath(); ctx.fill();
    if (label) { ctx.font = MONO; ctx.textAlign = 'left'; ctx.fillText(label, x2 + 6, y2 + 4); }
  }
  function glow(ctx, x, y, r, color = C.cyan) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, color + 'aa'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#f4fbff'; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
  }
  function hatch(ctx, x, y, w, dir = 1) { ctx.strokeStyle = C.faint; ctx.lineWidth = 1; for (let i = 0; i < w; i += 9) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i - 7, y + 8 * dir); ctx.stroke(); } }

  /* ---------- projectile ---------- */
  function drawProjectile(ctx, w, h, model, t) {
    const g = model.geometry, padL = 58, padR = 30, padT = 44, padB = 46;
    const scale = Math.min((w - padL - padR) / Math.max(g.range, 1), (h - padT - padB) / Math.max(g.maxHeight, 1)); // equal axis scale
    const ox = padL, oy = h - padB, visW = (w - padL - padR) / scale, visH = (h - padT - padB) / scale;
    const px = (x) => ox + x * scale, py = (y) => oy - y * scale;
    const xt = niceTicks(0, visW, Math.max(3, w / 110)), yt = niceTicks(0, visH, Math.max(3, h / 90));
    ctx.font = MONO; ctx.lineWidth = 1;
    yt.ticks.filter((v) => v > 0 && v <= visH).forEach((v) => { ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(ox, py(v) + .5); ctx.lineTo(w - padR, py(v) + .5); ctx.stroke(); ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.fillText(String(+v.toPrecision(4)), ox - 8, py(v) + 4); });
    xt.ticks.filter((v) => v <= visW).forEach((v) => { ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(px(v) + .5, oy); ctx.lineTo(px(v) + .5, padT); ctx.stroke(); ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.fillText(String(+v.toPrecision(4)), px(v), oy + 18); });
    ctx.fillStyle = C.muted; ctx.textAlign = 'center'; ctx.fillText('x (m)', (ox + w - padR) / 2, h - 8); ctx.save(); ctx.translate(14, (padT + oy) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('y (m)', 0, 0); ctx.restore();
    ctx.fillStyle = 'rgba(70,95,140,.28)'; ctx.fillRect(0, oy, w, padB); ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(0, oy + .5); ctx.lineTo(w, oy + .5); ctx.stroke();
    if (g.h0 > 0) { ctx.fillStyle = 'rgba(120,150,200,.3)'; ctx.strokeStyle = C.axis; ctx.fillRect(ox - 16, py(g.h0), 14, g.h0 * scale); ctx.strokeRect(ox - 16, py(g.h0), 14, g.h0 * scale); }
    const path = (t1) => { ctx.beginPath(); for (let i = 0; i <= 160; i++) { const s = model.stateAt((t1 * i) / 160); i ? ctx.lineTo(px(s.x), py(s.y)) : ctx.moveTo(px(s.x), py(s.y)); } };
    ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(120,160,215,.5)'; ctx.lineWidth = 1.5; path(model.duration); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; path(t); ctx.stroke();
    if (g.maxHeight > g.h0 + 1e-9) { const ax = px(g.vx0 * g.tApex), ay = py(g.maxHeight); ctx.fillStyle = C.violet; ctx.beginPath(); ctx.moveTo(ax, ay - 6); ctx.lineTo(ax + 5, ay); ctx.lineTo(ax, ay + 6); ctx.lineTo(ax - 5, ay); ctx.closePath(); ctx.fill(); ctx.textAlign = 'center'; ctx.fillText(`apex ${fmt(g.maxHeight, 1)} m`, ax, ay - 12); }
    if (g.range > 0) { ctx.fillStyle = C.warn; ctx.beginPath(); ctx.arc(px(g.range), oy, 4, 0, 7); ctx.fill(); ctx.textAlign = 'center'; ctx.fillText(`range ${fmt(g.range, 1)} m`, Math.min(px(g.range), w - 60), oy + 34); }
    const s = model.stateAt(t), bx = px(s.x), by = py(s.y), k = 70 / Math.max(Math.hypot(g.vx0, g.vy0), 1e-9);
    ctx.lineCap = 'butt'; arrow(ctx, bx, by, bx + s.vx * k, by, C.blue, 'vₓ'); arrow(ctx, bx, by, bx, by - s.vy * k, C.cyan, 'v_y'); arrow(ctx, bx, by, bx + s.vx * k, by - s.vy * k, '#eaf2ff');
    glow(ctx, bx, by, 6);
  }

  /* ---------- pendulum ---------- */
  function drawPendulum(ctx, w, h, model, t) {
    const { L, m, theta0 } = model.geometry, c0 = Math.cos(theta0), sMax = Math.max(Math.sin(theta0), 0.25);
    const padT = 56, padB = 54, extentY = L - Math.min(0, L * c0);
    const scale = Math.min((h - padT - padB) / extentY, (w / 2 - 60) / (L * sMax));
    const ox = w / 2, oy = padT + Math.abs(Math.min(0, c0)) * L * scale, R = L * scale, s = model.stateAt(t);
    const pos = (th) => [ox + Math.sin(th) * R, oy + Math.cos(th) * R];
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; for (let x = ox % 48; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = oy % 48; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(170,190,230,.4)'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + R + 24); ctx.stroke();
    ctx.strokeStyle = 'rgba(53,211,227,.28)'; ctx.beginPath(); ctx.arc(ox, oy, R, Math.PI / 2 - theta0, Math.PI / 2 + theta0); ctx.stroke(); ctx.setLineDash([]);
    const [gx, gy] = pos(theta0); ctx.strokeStyle = 'rgba(169,155,255,.5)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(gx, gy); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(gx, gy, 9, 0, 7); ctx.stroke();
    for (let i = 28; i >= 1; i--) { const sp = model.stateAt(Math.max(0, t - i * 0.025)), [tx, ty] = pos(sp.theta); ctx.fillStyle = `rgba(53,211,227,${0.012 * (29 - i)})`; ctx.beginPath(); ctx.arc(tx, ty, 4, 0, 7); ctx.fill(); } // fading bob trail
    const [bx, by] = pos(s.theta), r = 11 + 5 * Math.cbrt(m);
    ctx.strokeStyle = '#8fa3c4'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = 'rgba(120,150,200,.35)'; ctx.fillRect(ox - 46, oy - 12, 92, 8); hatch(ctx, ox - 46, oy - 12, 92, -1);
    ctx.fillStyle = C.muted; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 7); ctx.fill();
    const ang = Math.abs(s.theta) > 0.02 ? 1 : 0; if (ang) { ctx.strokeStyle = C.warn; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox, oy, 42, Math.PI / 2 - Math.max(s.theta, 0), Math.PI / 2 - Math.min(s.theta, 0)); ctx.stroke(); }
    glow(ctx, bx, by, r * 0.8); ctx.font = MONO; ctx.fillStyle = C.warn; ctx.textAlign = 'left'; ctx.fillText(`θ = ${fmt((s.theta * 180) / Math.PI, 1)}°`, ox + 52, oy + 30);
    ctx.fillStyle = C.muted; ctx.fillText(`L = ${fmt(L, 2)} m`, ox + 10, oy + R / 2); ctx.fillText(`m = ${fmt(m, 1)} kg`, 14, h - 14);
  }

  /* ---------- spring–mass ---------- */
  function drawSpring(ctx, w, h, model, t) {
    let amp = amplitudeCache.get(model); if (amp == null) { amp = Math.max(0.05, ...model.sample(150).map((r) => Math.abs(r.x))); amplitudeCache.set(model, amp); }
    const { m, zeta } = model.geometry, top = 34, eq = h * 0.5, scale = Math.min((h * 0.34) / amp, 260), s = model.stateAt(t);
    const cx = w / 2, boxW = 72 + 12 * Math.cbrt(m), boxH = 40 + 4 * Math.cbrt(m), yTop = eq + s.x * scale - boxH / 2;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; for (let x = cx % 48; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.fillStyle = 'rgba(120,150,200,.35)'; ctx.fillRect(cx - 120, top - 10, 240, 8); hatch(ctx, cx - 120, top - 10, 240, -1);
    ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(170,190,230,.5)'; ctx.beginPath(); ctx.moveTo(cx - 140, eq); ctx.lineTo(cx + 140, eq); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = MONO; ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.fillText('x = 0 (equilibrium)', cx + 146, eq + 4);
    const sx = cx - 28, coils = 12, a = 20, y0 = top - 2, y1 = yTop; // spring
    ctx.strokeStyle = C.blue; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(sx, y0); ctx.lineTo(sx, y0 + 12);
    for (let i = 0; i < coils * 2; i++) ctx.lineTo(sx + (i % 2 ? a : -a), y0 + 12 + ((y1 - 10 - y0 - 12) * (i + 0.5)) / (coils * 2));
    ctx.lineTo(sx, y1 - 10); ctx.lineTo(sx, y1); ctx.stroke();
    if (zeta > 0) { // dashpot: rod from ceiling, cylinder rides with the mass
      const dx = cx + 30, cyl = Math.max(14, Math.min(46, (yTop - top) * 0.55)); ctx.strokeStyle = C.violet; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(dx, top - 2); ctx.lineTo(dx, yTop - cyl * 0.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(dx - 9, yTop - cyl * 0.6); ctx.lineTo(dx + 9, yTop - cyl * 0.6); ctx.stroke();
      ctx.strokeRect(dx - 12, yTop - cyl, 24, cyl); ctx.beginPath(); ctx.moveTo(dx, yTop - cyl); ctx.moveTo(dx, yTop); ctx.stroke();
    }
    const gr = ctx.createLinearGradient(0, yTop, 0, yTop + boxH); gr.addColorStop(0, '#1f4a78'); gr.addColorStop(1, '#17375c');
    ctx.fillStyle = gr; ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(cx - boxW / 2, yTop, boxW, boxH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.text; ctx.textAlign = 'center'; ctx.font = '600 13px ui-monospace, Menlo, Consolas, monospace'; ctx.fillText(`${fmt(m, 1)} kg`, cx, yTop + boxH / 2 + 5);
    ctx.font = MONO; const cyM = yTop + boxH / 2; arrow(ctx, cx + boxW / 2 + 40, eq, cx + boxW / 2 + 40, cyM, C.warn); ctx.fillStyle = C.warn; ctx.textAlign = 'left'; ctx.fillText(`x = ${fmt(s.x, 3)} m`, cx + boxW / 2 + 52, (eq + cyM) / 2 + 4);
  }

  /* ---------- RC circuit ---------- */
  function drawRC(ctx, w, h, model, t) {
    const { vInf, V0, mode, Vs } = model.geometry, s = model.stateAt(t), tau = model.geometry.tau;
    const W = Math.min(w * 0.7, 520), H = Math.min(h * 0.56, 230), x0 = (w - W) / 2, y0 = (h - H) / 2 + 6, x1 = x0 + W, y1 = y0 + H, P = 2 * (W + H);
    const at = (d) => { d = ((d % P) + P) % P; if (d < W) return [x0 + d, y0]; d -= W; if (d < H) return [x1, y0 + d]; d -= H; if (d < W) return [x1 - d, y1]; d -= W; return [x0, y1 - d]; };
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#8fa3c4'; ctx.lineWidth = 2.6; ctx.strokeRect(x0, y0, W, H);
    // charge-flow dots: displacement ∝ charge moved, so motion slows exactly as the current decays
    const dV = vInf - V0, frac = dV === 0 ? 0 : (s.vc - V0) / dV, sp = 34, off = Math.sign(dV) * frac * sp * 6;
    ctx.fillStyle = C.cyan; for (let d = off; d < off + P; d += sp) { const [dx, dy] = at(d); ctx.beginPath(); ctx.arc(dx, dy, 2.8, 0, 7); ctx.fill(); }
    const mask = (x, y, ww, hh) => { ctx.fillStyle = '#0d1830'; ctx.fillRect(x, y, ww, hh); };
    // resistor (top centre)
    const rx = x0 + W / 2; mask(rx - 46, y0 - 14, 92, 28); ctx.strokeStyle = C.violet; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(rx - 46, y0);
    for (let i = 0; i < 6; i++) ctx.lineTo(rx - 36 + i * 14.4 + 7, y0 + (i % 2 ? 11 : -11)); ctx.lineTo(rx + 46, y0); ctx.stroke();
    // capacitor (right centre) — plate tint shows stored charge
    const cy = y0 + H / 2, vmax = Math.max(Math.abs(Vs), Math.abs(V0), 1e-9), q = Math.min(1, Math.abs(s.vc) / vmax);
    mask(x1 - 22, cy - 30, 44, 60); ctx.lineWidth = 4; ctx.strokeStyle = `rgba(91,155,255,${0.35 + 0.65 * q})`; ctx.beginPath(); ctx.moveTo(x1 - 18, cy - 24); ctx.lineTo(x1 + 18, cy - 24); ctx.stroke();
    ctx.strokeStyle = `rgba(169,155,255,${0.35 + 0.65 * q})`; ctx.beginPath(); ctx.moveTo(x1 - 18, cy + 24); ctx.lineTo(x1 + 18, cy + 24); ctx.stroke(); ctx.strokeStyle = '#8fa3c4'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x1, cy - 24); ctx.lineTo(x1, cy - 30); ctx.moveTo(x1, cy + 24); ctx.lineTo(x1, cy + 30); ctx.stroke();
    // source (left centre) — replaced by a plain wire when discharging
    if (mode === 'charge') { mask(x0 - 20, cy - 24, 40, 48); ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 16, cy - 8); ctx.lineTo(x0 + 16, cy - 8); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 9, cy + 8); ctx.lineTo(x0 + 9, cy + 8); ctx.stroke(); }
    ctx.font = MONO; ctx.textAlign = 'center'; ctx.fillStyle = C.muted;
    const rF = fmtSI(model.geometry.tau, 's'); void rF;
    ctx.fillText('R', rx, y0 - 22); ctx.fillText('C', x1 + 34, cy + 4); ctx.textAlign = 'right'; if (mode === 'charge') { ctx.fillText(`Vs = ${fmt(Vs, 1)} V`, x0 - 26, cy + 4); ctx.textAlign = 'left'; ctx.fillStyle = C.blue; ctx.fillText('+', x0 + 22, cy - 4); } else ctx.fillText('source disconnected', x0 - 12, cy + 4);
    // centre read-out and progress toward steady state
    const cxm = x0 + W / 2, cym = y0 + H / 2, v = fmtSI(s.vc, 'V'); ctx.textAlign = 'center'; ctx.fillStyle = C.text; ctx.font = '700 26px ui-sans-serif, system-ui, Segoe UI, Arial'; ctx.fillText(`${v.text} ${v.unit}`, cxm, cym + 2);
    ctx.font = MONO; ctx.fillStyle = C.muted; ctx.fillText('capacitor voltage', cxm, cym - 24);
    const bw = Math.min(220, W * 0.55), bx = cxm - bw / 2, by = cym + 26; ctx.fillStyle = 'rgba(148,163,205,.16)'; ctx.fillRect(bx, by, bw, 6); const gradient = ctx.createLinearGradient(bx, 0, bx + bw, 0); gradient.addColorStop(0, C.blue); gradient.addColorStop(1, C.cyan);
    ctx.fillStyle = gradient; ctx.fillRect(bx, by, bw * Math.max(0, Math.min(1, frac)), 6); ctx.fillStyle = C.muted; ctx.fillText(`${fmt(frac * 100, 1)} % of transition · t/τ = ${fmt(s.t / tau, 2)}`, cxm, by + 24);
    const i = fmtSI(s.i, 'A'); ctx.fillStyle = C.cyan; ctx.textAlign = 'left'; ctx.fillText(`i = ${i.text} ${i.unit}`, x0 + 8, y1 + 28);
  }

  const DRAW = { projectile: drawProjectile, pendulum: drawPendulum, spring: drawSpring, rc: drawRC };

  class Viewport {
    constructor(canvas, simId) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.simId = simId; this.model = null; this.t = 0; this.ro = new ResizeObserver(() => this.draw()); this.ro.observe(canvas); }
    destroy() { this.ro.disconnect(); }
    update(model, t) { this.model = model; this.t = t; this.draw(); }
    draw() {
      const c = this.canvas, r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; if (!r.width || !r.height || !this.model) return;
      if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.ctx.clearRect(0, 0, r.width, r.height);
      this.ctx.save(); DRAW[this.simId](this.ctx, r.width, r.height, this.model, this.t); this.ctx.restore();
    }
  }
  SC.Viewport = Viewport;
})(typeof globalThis !== 'undefined' ? globalThis : this);
