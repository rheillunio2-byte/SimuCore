/* SimuCore — settings. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {}); SC.views = SC.views || {};
  SC.views.settings = function (el, ctx) {
    const st = ctx.settings.get();
    el.innerHTML = `<div class="page-head"><div><div class="eyebrow">Preferences</div><h1>Settings</h1><p>Preferences are saved in this browser.</p></div></div>
    <div class="two-col" style="align-items:start"><section class="panel"><div class="panel-head"><div class="panel-title">Interface</div></div><div class="panel-body">
      <div class="field"><span class="field-label" id="lbl-motion">Animation</span><p class="panel-meta" style="margin:4px 0 8px">“System” follows your operating system’s reduced-motion setting.</p><div class="segmented" role="radiogroup" aria-labelledby="lbl-motion">${[['system', 'System'], ['reduced', 'Reduced'], ['full', 'Full']].map(([v, t]) => `<button type="button" role="radio" data-motion="${v}" aria-checked="${st.motion === v}" tabindex="${st.motion === v ? 0 : -1}">${t}</button>`).join('')}</div></div>
      <div class="field"><label for="set-speed" class="field-label">Default playback speed</label><select class="select" id="set-speed" style="margin-top:8px;width:100%">${['0.25', '0.5', '1', '2', '4'].map((v) => `<option value="${v}" ${String(st.speed) === v ? 'selected' : ''}>${v}×</option>`).join('')}</select></div></div></section>
    <section class="panel"><div class="panel-head"><div class="panel-title">Data &amp; storage</div></div><div class="panel-body">
      <dl class="kv" style="margin-bottom:16px"><dt>Storage</dt><dd>${SC.storage.persistent ? 'Browser localStorage' : 'Memory only (not persistent)'}</dd><dt>Saved experiments</dt><dd id="set-count">${SC.experiments.list().length}</dd><dt>Version</dt><dd>2.0.0</dd></dl>
      <p class="panel-meta" style="margin-bottom:12px">Removes saved experiments, remembered parameters and preferences from this browser.</p><button class="btn btn-danger" id="clear" type="button">Clear all saved data</button></div></section></div>`;
    el.querySelector('[role=radiogroup]').addEventListener('click', (e) => { const b = e.target.closest('[data-motion]'); if (!b) return; ctx.settings.set({ motion: b.dataset.motion }); el.querySelectorAll('[data-motion]').forEach((x) => { const on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); SC.notify.toast('Animation preference saved.', 'success'); });
    el.querySelector('[role=radiogroup]').addEventListener('keydown', (e) => { const b = e.target.closest('[data-motion]'); if (!b || !/Arrow/.test(e.key)) return; e.preventDefault(); const all = [...el.querySelectorAll('[data-motion]')], n = all[(all.indexOf(b) + (/Right|Down/.test(e.key) ? 1 : -1) + all.length) % all.length]; n.focus(); n.click(); });
    el.querySelector('#set-speed').addEventListener('change', (e) => { ctx.settings.set({ speed: e.target.value }); SC.notify.toast('Default speed saved.', 'success'); });
    el.querySelector('#clear').addEventListener('click', async () => {
      if (!(await SC.notify.confirm({ title: 'Clear all saved data?', message: 'This permanently deletes every saved experiment and preference in this browser.', confirmText: 'Clear everything', danger: true }))) return;
      SC.experiments.clear(); ctx.resetAll(); SC.notify.toast('All saved data cleared.', 'success'); el.querySelector('#set-count').textContent = '0'; el.querySelector('#set-speed').value = '1';
      el.querySelectorAll('[data-motion]').forEach((x) => { const on = x.dataset.motion === 'system'; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
    });
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
