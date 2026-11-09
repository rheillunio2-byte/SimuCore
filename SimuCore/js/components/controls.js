/* SimuCore — parameter controls: slider + numeric input (kept in sync), presets, segmented choices. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  const esc = (s) => SC.util.escapeHtml(s);
  const decimalsOf = (p) => (p.decimals != null ? p.decimals : p.step < 1 ? 2 : 0);
  const SLIDER_STEPS = 1000;

  const toSlider = (p, v) => (p.log ? (Math.log(v / p.min) / Math.log(p.max / p.min)) * SLIDER_STEPS : v);
  const fromSlider = (p, pos) => (p.log ? Number((p.min * Math.pow(p.max / p.min, pos / SLIDER_STEPS)).toPrecision(3)) : pos);

  /** @param {HTMLElement} host @param {string} simId @param {object} values @param {{onChange:(key,value,all)=>void}} opts */
  function createControls(host, simId, values, { onChange }) {
    const cfg = SC.config.sims[simId]; let cur = { ...values };
    host.innerHTML = cfg.params.map((p) => {
      if (p.type === 'choice') {
        return `<div class="field" data-field="${p.key}"><div class="field-top"><span class="field-label" id="lbl-${p.key}">${esc(p.label)}</span></div><div class="segmented" role="radiogroup" aria-labelledby="lbl-${p.key}">${p.options.map(([v, t]) => `<button type="button" role="radio" data-choice="${v}" aria-checked="false" tabindex="-1">${esc(t)}</button>`).join('')}</div></div>`;
      }
      const sMin = p.log ? 0 : p.min, sMax = p.log ? SLIDER_STEPS : p.max, sStep = p.log ? 1 : p.step;
      return `<div class="field" data-field="${p.key}"><div class="field-top"><label for="num-${p.key}" id="lbl-${p.key}">${esc(p.label)}</label><div class="num-wrap"><input class="num" id="num-${p.key}" type="number" step="any" min="${p.min}" max="${p.max}" inputmode="decimal" aria-describedby="rng-${p.key}-b"><span class="unit">${esc(p.unit)}</span></div></div>
      <input type="range" id="rng-${p.key}" min="${sMin}" max="${sMax}" step="${sStep}" aria-labelledby="lbl-${p.key}" aria-valuetext="">
      <div class="bounds" id="rng-${p.key}-b"><span>${p.min} ${esc(p.unit)}</span><span>${p.log ? 'log scale' : ''}</span><span>${p.max} ${esc(p.unit)}</span></div>
      ${p.presets ? `<div class="preset-row" role="group" aria-label="${esc(p.label)} presets">${p.presets.map(([n, v]) => `<button type="button" class="chip chip-btn" data-preset="${p.key}" data-value="${v}">${esc(n)} ${v}</button>`).join('')}</div>` : ''}
      ${p.special === 'critical' ? `<div class="preset-row"><button type="button" class="btn btn-sm" data-critical>Set critical damping</button></div>` : ''}</div>`;
    }).join('');

    function paint() {
      cfg.params.forEach((p) => {
        const v = cur[p.key], f = host.querySelector(`[data-field="${p.key}"]`);
        if (p.type === 'choice') { f.querySelectorAll('[data-choice]').forEach((b) => { const on = b.dataset.choice === v; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; }); return; }
        const num = f.querySelector('.num'), rng = f.querySelector('input[type=range]');
        if (document.activeElement !== num) num.value = Number(v).toFixed(decimalsOf(p));
        num.removeAttribute('aria-invalid');
        rng.value = toSlider(p, v); rng.setAttribute('aria-valuetext', `${Number(v).toFixed(decimalsOf(p))} ${p.unit}`);
        rng.style.setProperty('--fill', ((rng.value - rng.min) / (rng.max - rng.min)) * 100 + '%');
      });
    }
    function commit(key, value) { cur = { ...cur, [key]: value }; paint(); onChange(key, value, cur); }

    host.addEventListener('input', (e) => {
      const rng = e.target.closest('input[type=range]'); if (!rng) return;
      const p = cfg.params.find((q) => 'rng-' + q.key === rng.id); commit(p.key, Math.min(p.max, Math.max(p.min, fromSlider(p, Number(rng.value)))));
    });
    host.addEventListener('change', (e) => {
      const num = e.target.closest('.num'); if (!num) return;
      const p = cfg.params.find((q) => 'num-' + q.key === num.id), raw = parseFloat(num.value);
      if (!Number.isFinite(raw)) { num.setAttribute('aria-invalid', 'true'); SC.notify.toast(`“${p.label}” needs a number.`, 'warn'); num.value = Number(cur[p.key]).toFixed(decimalsOf(p)); return; }
      const v = Math.min(p.max, Math.max(p.min, raw));
      if (v !== raw) SC.notify.toast(`${p.label} limited to ${p.min}–${p.max} ${p.unit}.`, 'warn');
      commit(p.key, v); num.value = Number(v).toFixed(decimalsOf(p)); // show the clamped value even though the field keeps focus
    });
    host.addEventListener('click', (e) => {
      const ch = e.target.closest('[data-choice]'); if (ch) { commit(ch.closest('[data-field]').dataset.field, ch.dataset.choice); return; }
      const pre = e.target.closest('[data-preset]'); if (pre) { commit(pre.dataset.preset, Number(pre.dataset.value)); return; }
      if (e.target.closest('[data-critical]')) {
        const p = cfg.params.find((q) => q.special === 'critical'), ccrit = 2 * Math.sqrt(cur.k * cur.m);
        const v = Math.min(p.max, ccrit); if (v < ccrit) SC.notify.toast(`Critical damping (${ccrit.toFixed(1)} N·s/m) exceeds the slider range; set to maximum.`, 'warn'); else SC.notify.toast(`Damping set to critical value ${ccrit.toFixed(2)} N·s/m.`, 'success');
        commit(p.key, v);
      }
    });
    host.addEventListener('keydown', (e) => { // arrow keys inside a radiogroup
      const b = e.target.closest('[data-choice]'); if (!b || !/Arrow/.test(e.key)) return; e.preventDefault();
      const all = [...b.parentElement.querySelectorAll('[data-choice]')], i = all.indexOf(b), n = all[(i + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length]; n.focus(); n.click();
    });
    paint();
    return { setValues(v) { cur = { ...v }; paint(); }, get values() { return cur; } };
  }
  SC.createControls = createControls;
})(typeof globalThis !== 'undefined' ? globalThis : this);
