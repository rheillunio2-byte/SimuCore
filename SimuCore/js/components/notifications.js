/* SimuCore — toast notifications and accessible modal dialogs. */
(function (root) {
  'use strict';
  const SC = (root.SimuCore = root.SimuCore || {});
  const esc = (s) => SC.util.escapeHtml(s);

  function toast(message, type = 'info', ms = 3600) {
    const host = document.getElementById('toasts'); if (!host) return;
    while (host.children.length >= 4) host.firstChild.remove();
    const el = document.createElement('div'); el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `<span class="tdot"></span><span>${esc(message)}</span><button type="button" aria-label="Dismiss notification">×</button>`;
    const close = () => { if (el.classList.contains('is-leaving')) return; el.classList.add('is-leaving'); setTimeout(() => el.remove(), 260); };
    el.querySelector('button').addEventListener('click', close);
    host.appendChild(el); setTimeout(close, ms);
  }

  /** Generic modal. `build` receives the modal element and returns a getter for the result. */
  function modal({ title, message, body = '', confirmText = 'OK', cancelText = 'Cancel', danger = false, onConfirm }) {
    return new Promise((resolve) => {
      const opener = document.activeElement, host = document.getElementById('modal-root');
      const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${esc(title)}</h2>${message ? `<p>${esc(message)}</p>` : ''}${body}<div class="actions"><button type="button" class="btn" data-cancel>${esc(cancelText)}</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button></div></div>`;
      host.appendChild(backdrop);
      const dlg = backdrop.firstElementChild, input = dlg.querySelector('input');
      const finish = (val) => { backdrop.remove(); document.removeEventListener('keydown', onKey, true); if (opener && opener.focus) opener.focus(); resolve(val); };
      const ok = () => { const r = onConfirm ? onConfirm(dlg) : true; if (r !== undefined && r !== false) finish(r); };
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); finish(null); }
        else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); ok(); }
        else if (e.key === 'Tab') { // keep focus inside the dialog
          const f = [...dlg.querySelectorAll('button, input')]; const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener('keydown', onKey, true);
      dlg.querySelector('[data-ok]').addEventListener('click', ok);
      dlg.querySelector('[data-cancel]').addEventListener('click', () => finish(null));
      backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) finish(null); });
      (input || dlg.querySelector('[data-ok]')).focus(); if (input) input.select();
    });
  }

  /** Ask for a short text; resolves with the trimmed string or null. */
  function promptText({ title, label, value = '', confirmText = 'Save', maxLength = 60 }) {
    return modal({
      title, confirmText,
      body: `<label for="dlg-input" class="sr-only">${esc(label)}</label><input id="dlg-input" class="text-input" type="text" maxlength="${maxLength}" value="${esc(value)}" placeholder="${esc(label)}" autocomplete="off"><div class="err-text" id="dlg-err" role="alert"></div>`,
      onConfirm(dlg) { const v = dlg.querySelector('input').value.trim(); if (!v) { dlg.querySelector('#dlg-err').textContent = 'Please enter a name.'; dlg.querySelector('input').setAttribute('aria-invalid', 'true'); return false; } return v; },
    });
  }
  const confirmAction = (opts) => modal({ ...opts, onConfirm: () => true }).then((r) => r === true);

  SC.notify = { toast, modal, promptText, confirm: confirmAction };
})(typeof globalThis !== 'undefined' ? globalThis : this);
