/* SimuCore — playback engine and numerical integrator.
 * The engine only advances a clock; models are pure functions of time (see js/simulations). */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});

  /**
   * One classical 4th-order Runge–Kutta step for y' = f(t, y).
   * @param {(t:number,y:number[])=>number[]} f
   */
  function rk4Step(f, t, y, h) {
    const n = y.length, add = (a, b, s) => a.map((v, i) => v + s * b[i]);
    const k1 = f(t, y), k2 = f(t + h / 2, add(y, k1, h / 2)), k3 = f(t + h / 2, add(y, k2, h / 2)), k4 = f(t + h, add(y, k3, h));
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  }

  class Engine {
    /** @param {{onFrame:(t:number)=>void, onStatus:(s:string)=>void}} hooks */
    constructor(hooks) {
      this.hooks = hooks; this.model = null; this.t = 0; this.speed = 1;
      this.status = 'ready'; this._raf = 0; this._last = 0; this._loop = this._loop.bind(this);
    }
    setModel(model, keepTime = false) {
      this.model = model;
      this.t = keepTime ? Math.min(this.t, model.duration) : 0;
      if (!keepTime) this._setStatus('ready');
      else if (this.status === 'complete' && this.t < model.duration) this._setStatus('paused');
      this.hooks.onFrame(this.t);
    }
    get playing() { return this.status === 'running'; }
    play() {
      if (!this.model) return;
      if (this.t >= this.model.duration) this.t = 0;
      this._last = 0; this._setStatus('running');
      cancelAnimationFrame(this._raf); this._raf = requestAnimationFrame(this._loop);
    }
    pause() { cancelAnimationFrame(this._raf); if (this.status === 'running') this._setStatus('paused'); }
    toggle() { this.playing ? this.pause() : this.play(); }
    reset() { cancelAnimationFrame(this._raf); this.t = 0; this._setStatus('ready'); this.hooks.onFrame(0); }
    step() { // advance 1% of the run
      if (!this.model) return;
      cancelAnimationFrame(this._raf);
      this.t = Math.min(this.model.duration, this.t + this.model.duration / 100);
      this._setStatus(this.t >= this.model.duration ? 'complete' : 'paused');
      this.hooks.onFrame(this.t);
    }
    seek(t) {
      if (!this.model) return;
      this.t = Math.min(this.model.duration, Math.max(0, t));
      if (!this.playing) this._setStatus(this.t >= this.model.duration ? 'complete' : this.t > 0 ? 'paused' : 'ready');
      this.hooks.onFrame(this.t);
    }
    setSpeed(s) { this.speed = s; }
    destroy() { cancelAnimationFrame(this._raf); }
    _setStatus(s) { if (this.status !== s) { this.status = s; this.hooks.onStatus(s); } }
    _loop(now) {
      if (!this.playing) return;
      if (!this._last) this._last = now;
      const dt = Math.min(0.05, (now - this._last) / 1000); // clamp so tab switches don't jump
      this._last = now;
      this.t += dt * this.speed * (this.model.timeScale || 1);
      if (this.t >= this.model.duration) { this.t = this.model.duration; this._setStatus('complete'); this.hooks.onFrame(this.t); return; }
      this.hooks.onFrame(this.t);
      this._raf = requestAnimationFrame(this._loop);
    }
  }
  SC.rk4Step = rk4Step;
  SC.Engine = Engine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
