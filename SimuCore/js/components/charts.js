/* SimuCore — canvas line chart: axes with units, grid, legend with live values, cursor, draw-in animation. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  const { siScale, niceTicks, fmt } = SC.util;
  const FONT = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  const tickText = (v, step) => { const d = Math.min(6, Math.max(0, -Math.floor(Math.log10(step || 1)))); return Number(v).toFixed(d); };
  const sig = (v) => { const a = Math.abs(v); return !Number.isFinite(v) ? '—' : a === 0 ? '0' : a >= 100 ? v.toFixed(1) : a >= 10 ? v.toFixed(2) : a >= 1 ? v.toFixed(3) : v.toPrecision(3); };

  class Chart {
    constructor(canvas, { onSeek } = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.onSeek = onSeek;
      this.def = null; this.rows = []; this.duration = 1; this.t = 0; this.progress = 1; this._raf = 0; this._anim = 0;
      this.ro = new ResizeObserver(() => this.requestDraw()); this.ro.observe(canvas);
      const seekFrom = (e) => { if (!this.onSeek || !this.plot) return; const r = canvas.getBoundingClientRect(); const x = (e.clientX - r.left - this.plot.l) / this.plot.w; this.onSeek(Math.min(1, Math.max(0, x)) * this.duration); };
      canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); this._drag = true; seekFrom(e); });
      canvas.addEventListener('pointermove', (e) => { if (this._drag) seekFrom(e); });
      const end = () => { this._drag = false; }; canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    }
    destroy() { this.ro.disconnect(); cancelAnimationFrame(this._raf); cancelAnimationFrame(this._anim); }
    /** @param {object} def chart definition from simulation-config  @param {object[]} rows sampled model rows (uniform in t) */
    setData(def, rows, duration, { animate = false } = {}) {
      this.def = def; this.rows = rows; this.duration = duration || 1;
      const all = def.series.flatMap((s) => rows.map((r) => r[s.key])).filter(Number.isFinite);
      const yAbs = Math.max(...all.map(Math.abs), 0);
      this.yScale = def.y.si ? siScale(yAbs) : { factor: 1, prefix: '' };
      this.xScale = siScale(this.duration);
      let lo = Math.min(...all, 0 + (all.length ? 0 : 0)), hi = Math.max(...all);
      if (!all.length) { lo = 0; hi = 1; }
      const dataLo = Math.min(...all), dataHi = Math.max(...all), pad = (dataHi - dataLo || Math.abs(dataHi) || 1) * 0.05;
      lo = dataLo >= 0 && dataLo < dataHi * 0.6 ? 0 : dataLo - pad; hi = dataHi + pad;
      this.yTicks = niceTicks(lo / this.yScale.factor, hi / this.yScale.factor, 5);
      cancelAnimationFrame(this._anim);
      if (animate && !SC.motion.reduced()) { const t0 = performance.now(); const step = (now) => { const p = Math.min(1, (now - t0) / 700); this.progress = 1 - Math.pow(1 - p, 3); this.draw(); if (p < 1) this._anim = requestAnimationFrame(step); }; this.progress = 0; this._anim = requestAnimationFrame(step); }
      else { this.progress = 1; this.requestDraw(); }
    }
    setCursor(t) { this.t = t; this.requestDraw(); }
    requestDraw() { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = 0; this.draw(); }); }
    valueAt(key, t) {
      const n = this.rows.length - 1; if (n < 1) return NaN; const u = Math.min(n, Math.max(0, (t / this.duration) * n)), i = Math.min(n - 1, Math.floor(u));
      return this.rows[i][key] + (this.rows[i + 1][key] - this.rows[i][key]) * (u - i);
    }
    draw() {
      const c = this.canvas, r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      if (!r.width || !r.height) return;
      if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
      const ctx = this.ctx, W = r.width, H = r.height; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (!this.def) return;
      const def = this.def, multi = def.series.length > 1;
      const l = 62, rgt = 16, top = 34, bot = 44, pw = W - l - rgt, ph = H - top - bot; this.plot = { l, w: pw, t: top, h: ph };
      const yt = this.yTicks, y0 = yt.min, y1 = yt.max, xf = this.xScale.factor;
      const X = (t) => l + (t / this.duration) * pw, Y = (v) => top + ph - ((v / this.yScale.factor - y0) / (y1 - y0 || 1)) * ph;
      ctx.font = FONT; ctx.lineWidth = 1;
      // grid + y ticks
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      yt.ticks.forEach((v) => { const y = top + ph - ((v - y0) / (y1 - y0 || 1)) * ph; ctx.strokeStyle = v === 0 ? 'rgba(170,190,230,.38)' : 'rgba(148,163,205,.12)'; ctx.beginPath(); ctx.moveTo(l, y + .5); ctx.lineTo(l + pw, y + .5); ctx.stroke(); ctx.fillStyle = '#93a1bd'; ctx.fillText(tickText(v, yt.step), l - 8, y); });
      // x ticks
      const xt = niceTicks(0, this.duration / xf, Math.max(3, Math.floor(pw / 90))); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      xt.ticks.filter((v) => v * xf <= this.duration * 1.0001).forEach((v) => { const x = X(v * xf); ctx.strokeStyle = 'rgba(148,163,205,.1)'; ctx.beginPath(); ctx.moveTo(x + .5, top); ctx.lineTo(x + .5, top + ph); ctx.stroke(); ctx.fillStyle = '#93a1bd'; ctx.fillText(tickText(v, xt.step), x, top + ph + 8); });
      ctx.strokeStyle = 'rgba(170,190,230,.4)'; ctx.strokeRect(l + .5, top + .5, pw, ph);
      // axis labels
      ctx.fillStyle = '#c3cfe6'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(`Time (${this.xScale.prefix}s)`, l + pw / 2, H - 6);
      ctx.save(); ctx.translate(13, top + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${def.y.label} (${this.yScale.prefix}${def.y.unit})`, 0, 0); ctx.restore();
      // series (clipped for draw-in animation)
      ctx.save(); ctx.beginPath(); ctx.rect(l, top - 2, pw * this.progress + 1, ph + 4); ctx.clip();
      def.series.forEach((s) => {
        ctx.beginPath(); ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.setLineDash(s.dash || []);
        this.rows.forEach((row, i) => { const v = row[s.key]; if (!Number.isFinite(v)) return; const x = X(row.t), y = Y(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.restore();
      // cursor + dots
      const cx = X(Math.min(this.t, this.duration)); ctx.strokeStyle = 'rgba(234,242,255,.55)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(cx + .5, top); ctx.lineTo(cx + .5, top + ph); ctx.stroke(); ctx.setLineDash([]);
      def.series.forEach((s) => { const v = this.valueAt(s.key, this.t); if (!Number.isFinite(v)) return; ctx.fillStyle = '#0a1226'; ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, Y(v), 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      // legend with live values
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; let lx = l, ly = 15; const showVals = W > 440;
      def.series.forEach((s) => {
        const v = this.valueAt(s.key, this.t), txt = s.label + (showVals ? ` = ${sig(v / this.yScale.factor)} ${this.yScale.prefix}${def.y.unit}` : '');
        const w = ctx.measureText(txt).width + 30; if (lx + w > W - 90 && lx > l) { lx = l; ly += 0; }
        ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.setLineDash(s.dash || []); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 16, ly); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#c3cfe6'; ctx.fillText(txt, lx + 22, ly); lx += w + 8;
      });
      ctx.textAlign = 'right'; ctx.fillStyle = '#eaf2ff'; const ts = SC.util.fmtSI(this.t, 's'); ctx.fillText(`t = ${ts.text} ${ts.unit}`, W - rgt, 15);
      void multi; void fmt;
    }
  }
  SC.Chart = Chart;
  SC.motion = {
    reduced() { const h = document.documentElement; return h.classList.contains('reduce-motion') || (!h.classList.contains('full-motion') && window.matchMedia('(prefers-reduced-motion: reduce)').matches); },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
